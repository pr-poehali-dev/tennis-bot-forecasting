import json
import os
import urllib.request
import re
from datetime import datetime, timezone

CORS_HEADERS = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, X-User-Id, X-Auth-Token, X-Session-Id',
    'Access-Control-Max-Age': '86400',
    'Content-Type': 'application/json'
}

UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36'


def handler(event, context):
    """Получение матчей настольного тенниса — платный API или бесплатный парсинг"""
    
    if event.get('httpMethod') == 'OPTIONS':
        return {'statusCode': 200, 'headers': CORS_HEADERS, 'body': ''}
    
    api_key = os.environ.get('RAPID_API_KEY', '')
    
    if api_key:
        return handle_paid_api(api_key)
    else:
        return handle_free_scraping()


def handle_paid_api(api_key):
    """Платный API RapidAPI"""
    all_events = []
    
    live_events = fetch_api(api_key, 'https://table-tennis.api-sports.io/games', {'live': 'all'})
    if live_events and 'response' in live_events:
        all_events.extend(live_events['response'])
    
    today = datetime.now(timezone.utc).strftime('%Y-%m-%d')
    scheduled = fetch_api(api_key, 'https://table-tennis.api-sports.io/games', {'date': today})
    if scheduled and 'response' in scheduled:
        all_events.extend(scheduled['response'])
    
    filtered = [ev for ev in all_events if is_liga_pro_api(ev)]
    
    return {
        'statusCode': 200,
        'headers': CORS_HEADERS,
        'body': json.dumps({
            'events': filtered,
            'total': len(filtered),
            'source': 'api-sports',
            'updatedAt': datetime.now(timezone.utc).isoformat()
        }, ensure_ascii=False)
    }


def handle_free_scraping():
    """Бесплатный парсинг открытых источников"""
    all_events = []
    
    try:
        flashscore_data = scrape_flashscore()
        all_events.extend(flashscore_data)
    except Exception as e:
        print(f'Flashscore scraping error: {str(e)}')
    
    filtered = [ev for ev in all_events if is_liga_pro_scraped(ev)]
    
    return {
        'statusCode': 200,
        'headers': CORS_HEADERS,
        'body': json.dumps({
            'events': filtered,
            'total': len(filtered),
            'source': 'free-scraping',
            'updatedAt': datetime.now(timezone.utc).isoformat()
        }, ensure_ascii=False)
    }


def scrape_flashscore():
    """Парсинг SofaScore Widget (публичный endpoint)"""
    events = []
    
    try:
        url = 'https://www.sofascore.com/api/v1/sport/table-tennis/events/live'
        headers = {
            'User-Agent': UA,
            'Accept': 'application/json',
            'Referer': 'https://www.sofascore.com/',
            'Origin': 'https://www.sofascore.com'
        }
        
        req = urllib.request.Request(url, headers=headers)
        with urllib.request.urlopen(req, timeout=10) as resp:
            data = json.loads(resp.read().decode('utf-8'))
            if 'events' in data:
                for ev in data['events']:
                    events.append(convert_sofascore_event(ev))
    except Exception as e:
        print(f'SofaScore API error: {str(e)}')
    
    try:
        today = datetime.now(timezone.utc).strftime('%Y-%m-%d')
        url = f'https://www.sofascore.com/api/v1/sport/table-tennis/scheduled-events/{today}'
        headers = {
            'User-Agent': UA,
            'Accept': 'application/json',
            'Referer': 'https://www.sofascore.com/',
            'Origin': 'https://www.sofascore.com'
        }
        
        req = urllib.request.Request(url, headers=headers)
        with urllib.request.urlopen(req, timeout=10) as resp:
            data = json.loads(resp.read().decode('utf-8'))
            if 'events' in data:
                for ev in data['events']:
                    events.append(convert_sofascore_event(ev))
    except Exception as e:
        print(f'SofaScore scheduled error: {str(e)}')
    
    return events


def convert_sofascore_event(ev):
    """Конвертация SofaScore события в универсальный формат"""
    home = ev.get('homeTeam', {})
    away = ev.get('awayTeam', {})
    status_obj = ev.get('status', {})
    tournament = ev.get('tournament', {})
    
    status_type = status_obj.get('type', 'notstarted')
    if status_type == 'inprogress':
        status = 'LIVE'
    elif status_type == 'finished':
        status = 'FT'
    else:
        status = 'scheduled'
    
    home_score = ev.get('homeScore', {}).get('current', 0)
    away_score = ev.get('awayScore', {}).get('current', 0)
    
    return {
        'id': ev.get('id', ''),
        'date': datetime.fromtimestamp(ev.get('startTimestamp', 0), tz=timezone.utc).isoformat() if ev.get('startTimestamp') else datetime.now(timezone.utc).isoformat(),
        'status': status,
        'league': {
            'name': tournament.get('name', 'Table Tennis'),
            'country': tournament.get('category', {}).get('name', 'International')
        },
        'teams': {
            'home': {
                'id': home.get('id', ''),
                'name': home.get('name', 'Player 1')
            },
            'away': {
                'id': away.get('id', ''),
                'name': away.get('name', 'Player 2')
            }
        },
        'scores': {
            'home': home_score,
            'away': away_score
        }
    }


def fetch_api(api_key, url, params=None):
    """RapidAPI запрос"""
    try:
        if params:
            query = '&'.join([f'{k}={v}' for k, v in params.items()])
            url = f'{url}?{query}'
        
        headers = {
            'x-rapidapi-key': api_key,
            'x-rapidapi-host': 'table-tennis.api-sports.io'
        }
        
        req = urllib.request.Request(url, headers=headers)
        with urllib.request.urlopen(req, timeout=15) as resp:
            return json.loads(resp.read().decode('utf-8'))
    except Exception as e:
        print(f'API error: {str(e)}')
        return None


def is_liga_pro_api(event):
    """Проверка Liga Pro для RapidAPI"""
    league = event.get('league', {})
    name = league.get('name', '').lower()
    keywords = ['liga pro', 'ligapro', 'setka cup', 'setka', 'tt cup', 'ttcup', 'masters', 'elite', 'win cup', 'wincup', 'challenge']
    return any(kw in name for kw in keywords)


def is_liga_pro_scraped(event):
    """Проверка Liga Pro для scraped данных"""
    league = event.get('league', {})
    name = league.get('name', '').lower()
    keywords = ['liga pro', 'ligapro', 'setka cup', 'setka', 'tt cup', 'ttcup', 'masters', 'elite', 'win cup', 'wincup', 'challenge']
    return any(kw in name for kw in keywords)
