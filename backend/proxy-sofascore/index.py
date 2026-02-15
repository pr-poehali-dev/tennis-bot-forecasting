import json
import urllib.request

CORS_HEADERS = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, X-User-Id, X-Auth-Token, X-Session-Id',
    'Access-Control-Max-Age': '86400',
    'Content-Type': 'application/json'
}

UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36'


def handler(event, context):
    """CORS-прокси для SofaScore API"""
    
    if event.get('httpMethod') == 'OPTIONS':
        return {'statusCode': 200, 'headers': CORS_HEADERS, 'body': ''}
    
    params = event.get('queryStringParameters') or {}
    url = params.get('url', '')
    
    if not url or 'sofascore.com' not in url:
        return {
            'statusCode': 400,
            'headers': CORS_HEADERS,
            'body': json.dumps({'error': 'Требуется параметр ?url= с SofaScore URL'}, ensure_ascii=False)
        }
    
    try:
        headers = {
            'User-Agent': UA,
            'Accept': 'application/json',
            'Accept-Language': 'en-US,en;q=0.9',
            'Referer': 'https://www.sofascore.com/',
            'Origin': 'https://www.sofascore.com',
            'Connection': 'keep-alive'
        }
        
        req = urllib.request.Request(url, headers=headers)
        with urllib.request.urlopen(req, timeout=15) as resp:
            data = resp.read()
            
            return {
                'statusCode': 200,
                'headers': CORS_HEADERS,
                'body': data.decode('utf-8')
            }
    
    except urllib.error.HTTPError as e:
        return {
            'statusCode': e.code,
            'headers': CORS_HEADERS,
            'body': json.dumps({'error': f'HTTP {e.code}: {e.reason}'}, ensure_ascii=False)
        }
    except Exception as e:
        return {
            'statusCode': 500,
            'headers': CORS_HEADERS,
            'body': json.dumps({'error': str(e)}, ensure_ascii=False)
        }
