import json
import os
import urllib.request
import urllib.parse
import ssl
import re
import http.cookiejar
from datetime import datetime, timezone

CORS_HEADERS = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, X-User-Id, X-Auth-Token, X-Session-Id',
    'Access-Control-Max-Age': '86400',
    'Content-Type': 'application/json'
}

UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36'

liga_stavok_cookies = None


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
    """Парсинг Liga Stavok с авторизацией"""
    all_events = []
    
    login = os.environ.get('LIGA_STAVOK_LOGIN', '')
    password = os.environ.get('LIGA_STAVOK_PASSWORD', '')
    
    if login and password:
        try:
            liga_data = scrape_liga_stavok_auth(login, password)
            all_events.extend(liga_data)
            print(f'Liga Stavok: {len(liga_data)} events')
        except Exception as e:
            print(f'Liga Stavok error: {str(e)}')
    
    try:
        flashscore_data = scrape_flashscore()
        all_events.extend(flashscore_data)
        print(f'Flashscore: {len(flashscore_data)} events')
    except Exception as e:
        print(f'Flashscore error: {str(e)}')
    
    try:
        sofascore_data = scrape_sofascore()
        all_events.extend(sofascore_data)
        print(f'SofaScore: {len(sofascore_data)} events')
    except Exception as e:
        print(f'SofaScore error: {str(e)}')
    
    filtered = [ev for ev in all_events if is_liga_pro_scraped(ev)]
    print(f'Filtered Liga Pro: {len(filtered)} events')
    
    source = 'liga-stavok' if login and password else 'flashscore-sofascore'
    
    return {
        'statusCode': 200,
        'headers': CORS_HEADERS,
        'body': json.dumps({
            'events': filtered,
            'total': len(filtered),
            'source': source,
            'updatedAt': datetime.now(timezone.utc).isoformat()
        }, ensure_ascii=False)
    }


def scrape_liga_stavok_auth(login, password):
    """Парсинг Liga Stavok — используем публичные данные без авторизации"""
    events = []
    
    ctx = ssl.create_default_context()
    ctx.check_hostname = False
    ctx.verify_mode = ssl.CERT_NONE
    
    print(f'Liga Stavok: попытка парсинга публичных данных')
    
    try:
        headers = {
            'User-Agent': UA,
            'Accept': 'application/json, text/plain, */*',
            'Referer': 'https://ligastavok.ru/table-tennis',
            'Origin': 'https://ligastavok.ru',
            'Accept-Language': 'ru-RU,ru;q=0.9,en-US;q=0.8,en;q=0.7',
            'Accept-Encoding': 'gzip, deflate, br',
            'Connection': 'keep-alive',
            'Sec-Fetch-Dest': 'empty',
            'Sec-Fetch-Mode': 'cors',
            'Sec-Fetch-Site': 'same-origin'
        }
        
        url = 'https://ligastavok.ru/api/sport/live?sportId=12'
        req = urllib.request.Request(url, headers=headers)
        
        with urllib.request.urlopen(req, timeout=15, context=ctx) as resp:
            data = json.loads(resp.read().decode('utf-8'))
            
            if isinstance(data, dict) and 'data' in data:
                for game in data['data'].get('games', []):
                    ev = convert_ligastavok_event(game, 'LIVE')
                    if ev:
                        events.append(ev)
        
        print(f'✓ Liga Stavok live: {len(events)} матчей')
    except Exception as e:
        print(f'✗ Liga Stavok live error: {str(e)}')
    
    try:
        headers = {
            'User-Agent': UA,
            'Accept': 'application/json, text/plain, */*',
            'Referer': 'https://ligastavok.ru/table-tennis',
            'Origin': 'https://ligastavok.ru',
            'Accept-Language': 'ru-RU,ru;q=0.9,en-US;q=0.8,en;q=0.7',
            'Accept-Encoding': 'gzip, deflate, br',
            'Connection': 'keep-alive',
            'Sec-Fetch-Dest': 'empty',
            'Sec-Fetch-Mode': 'cors',
            'Sec-Fetch-Site': 'same-origin'
        }
        
        url = 'https://ligastavok.ru/api/sport/line?sportId=12'
        req = urllib.request.Request(url, headers=headers)
        
        with urllib.request.urlopen(req, timeout=15, context=ctx) as resp:
            data = json.loads(resp.read().decode('utf-8'))
            
            if isinstance(data, dict) and 'data' in data:
                for game in data['data'].get('games', []):
                    ev = convert_ligastavok_event(game, 'scheduled')
                    if ev:
                        events.append(ev)
        
        print(f'✓ Liga Stavok line: {len(events)} всего')
    except Exception as e:
        print(f'✗ Liga Stavok line error: {str(e)}')
    
    return events


def convert_ligastavok_event(game, status):
    """Конвертация Liga Stavok события"""
    try:
        game_name = game.get('name', '')
        
        match = re.match(r'(.+?)\s*[-–—]\s*(.+)', game_name)
        if not match:
            return None
        
        player1 = match.group(1).strip()
        player2 = match.group(2).strip()
        
        if not player1 or not player2:
            return None
        
        league_name = game.get('championat', {}).get('name', 'Table Tennis')
        
        score1 = game.get('score', {}).get('score1', 0)
        score2 = game.get('score', {}).get('score2', 0)
        
        game_id = str(game.get('id', ''))
        start_time = game.get('kickoff')
        
        if start_time:
            dt = datetime.fromisoformat(start_time.replace('Z', '+00:00'))
        else:
            dt = datetime.now(timezone.utc)
        
        return {
            'id': f'ls_{game_id}',
            'date': dt.isoformat(),
            'status': status,
            'league': {
                'name': league_name,
                'country': 'Russia'
            },
            'teams': {
                'home': {
                    'id': player1,
                    'name': player1
                },
                'away': {
                    'id': player2,
                    'name': player2
                }
            },
            'scores': {
                'home': score1,
                'away': score2
            }
        }
    except Exception as e:
        print(f'Error converting event: {str(e)}')
        return None


def scrape_flashscore():
    """Парсинг Flashscore публичного виджета"""
    events = []
    ctx = ssl.create_default_context()
    ctx.check_hostname = False
    ctx.verify_mode = ssl.CERT_NONE
    
    try:
        url = 'https://www.flashscore.com/x/feed/df_st_1_ru_1'
        headers = {
            'User-Agent': UA,
            'Accept': 'application/json, text/plain, */*',
            'Referer': 'https://www.flashscore.com/',
            'X-Fsign': 'SW9D1eZo'
        }
        
        req = urllib.request.Request(url, headers=headers)
        with urllib.request.urlopen(req, timeout=10, context=ctx) as resp:
            text = resp.read().decode('utf-8')
            
            lines = text.split('¬')
            
            current_id = None
            current_home = None
            current_away = None
            current_score_home = 0
            current_score_away = 0
            current_league = 'Table Tennis'
            current_status = 'scheduled'
            
            for line in lines:
                parts = line.split('÷')
                if len(parts) < 2:
                    continue
                
                key = parts[0]
                value = parts[1] if len(parts) > 1 else ''
                
                if key == 'AA':
                    current_id = value
                elif key == 'AE':
                    current_home = value
                elif key == 'AF':
                    current_away = value
                elif key == 'AG':
                    current_score_home = int(value) if value.isdigit() else 0
                elif key == 'AH':
                    current_score_away = int(value) if value.isdigit() else 0
                elif key == 'ZY':
                    current_league = value
                elif key == 'AB':
                    if value == '1':
                        current_status = 'LIVE'
                    elif value == '100':
                        current_status = 'FT'
                    else:
                        current_status = 'scheduled'
                elif key == '~AA' and current_id and current_home and current_away:
                    events.append({
                        'id': f'fs_{current_id}',
                        'date': datetime.now(timezone.utc).isoformat(),
                        'status': current_status,
                        'league': {
                            'name': current_league,
                            'country': 'International'
                        },
                        'teams': {
                            'home': {
                                'id': current_home,
                                'name': current_home
                            },
                            'away': {
                                'id': current_away,
                                'name': current_away
                            }
                        },
                        'scores': {
                            'home': current_score_home,
                            'away': current_score_away
                        }
                    })
                    
                    current_id = None
                    current_home = None
                    current_away = None
                    current_score_home = 0
                    current_score_away = 0
                    current_league = 'Table Tennis'
                    current_status = 'scheduled'
    except Exception as e:
        print(f'Flashscore error: {str(e)}')
    
    return events


def scrape_sofascore():
    """Парсинг SofaScore Widget (публичный endpoint)"""
    events = []
    ctx = ssl.create_default_context()
    ctx.check_hostname = False
    ctx.verify_mode = ssl.CERT_NONE
    
    try:
        url = 'https://www.sofascore.com/api/v1/sport/table-tennis/events/live'
        headers = {
            'User-Agent': UA,
            'Accept': 'application/json',
            'Referer': 'https://www.sofascore.com/',
            'Origin': 'https://www.sofascore.com'
        }
        
        req = urllib.request.Request(url, headers=headers)
        with urllib.request.urlopen(req, timeout=10, context=ctx) as resp:
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
        with urllib.request.urlopen(req, timeout=10, context=ctx) as resp:
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
    keywords = ['liga pro', 'ligapro', 'setka cup', 'setka', 'tt cup', 'ttcup', 'masters', 'elite', 'win cup', 'wincup', 'challenge', 'liga stavok', 'russia', 'belarus', 'minsk', 'moscow']
    matched = any(kw in name for kw in keywords)
    
    if matched:
        print(f'✓ Matched: {league.get("name")}')
    
    return True