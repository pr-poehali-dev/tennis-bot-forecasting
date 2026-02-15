import json
import os
import urllib.request
from datetime import datetime, timezone

CORS_HEADERS = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, X-User-Id, X-Auth-Token, X-Session-Id',
    'Access-Control-Max-Age': '86400',
    'Content-Type': 'application/json'
}


def handler(event, context):
    """Получение матчей настольного тенниса через API-Sports (RapidAPI)"""
    
    if event.get('httpMethod') == 'OPTIONS':
        return {'statusCode': 200, 'headers': CORS_HEADERS, 'body': ''}
    
    api_key = os.environ.get('RAPID_API_KEY', '')
    if not api_key:
        return {
            'statusCode': 200,
            'headers': CORS_HEADERS,
            'body': json.dumps({
                'events': [],
                'total': 0,
                'source': 'demo',
                'message': 'API ключ не настроен, используйте demo режим',
                'updatedAt': datetime.now(timezone.utc).isoformat()
            }, ensure_ascii=False)
        }
    
    params = event.get('queryStringParameters') or {}
    mode = params.get('mode', 'all')
    
    all_events = []
    
    if mode == 'live' or mode == 'all':
        live_events = fetch_api(api_key, 'https://table-tennis.api-sports.io/games', {'live': 'all'})
        if live_events and 'response' in live_events:
            all_events.extend(live_events['response'])
    
    if mode == 'today' or mode == 'all':
        today = datetime.now(timezone.utc).strftime('%Y-%m-%d')
        scheduled = fetch_api(api_key, 'https://table-tennis.api-sports.io/games', {'date': today})
        if scheduled and 'response' in scheduled:
            all_events.extend(scheduled['response'])
    
    filtered = []
    for ev in all_events:
        if is_liga_pro(ev):
            filtered.append(ev)
    
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


def fetch_api(api_key, url, params=None):
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


def is_liga_pro(event):
    league = event.get('league', {})
    name = league.get('name', '').lower()
    
    keywords = [
        'liga pro', 'ligapro', 'setka cup', 'setka',
        'tt cup', 'ttcup', 'masters', 'elite',
        'win cup', 'wincup', 'challenge'
    ]
    
    return any(kw in name for kw in keywords)
