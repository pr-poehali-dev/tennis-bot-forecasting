import json
import os
import psycopg2
from datetime import datetime, timezone

CORS_HEADERS = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, X-User-Id, X-Auth-Token, X-Session-Id',
    'Access-Control-Max-Age': '86400',
    'Content-Type': 'application/json'
}


def handler(event, context):
    """Сохранение прогнозов в БД и обновление результатов"""

    if event.get('httpMethod') == 'OPTIONS':
        return {'statusCode': 200, 'headers': CORS_HEADERS, 'body': ''}

    db_url = os.environ.get('DATABASE_URL', '')
    if not db_url:
        return {
            'statusCode': 500,
            'headers': CORS_HEADERS,
            'body': json.dumps({'error': 'DATABASE_URL not configured'}, ensure_ascii=False)
        }

    body = {}
    if event.get('body'):
        body = json.loads(event['body'])

    matches = body.get('matches', [])
    if not matches:
        return {
            'statusCode': 400,
            'headers': CORS_HEADERS,
            'body': json.dumps({'error': 'No matches provided'}, ensure_ascii=False)
        }

    conn = psycopg2.connect(db_url)
    cur = conn.cursor()

    saved = 0
    updated = 0
    errors = []

    for m in matches:
        try:
            match_id = m.get('id')
            if not match_id or not m.get('prediction'):
                continue

            p1_name = m.get('player1', {}).get('name', '')
            p2_name = m.get('player2', {}).get('name', '')
            match_name = f"{p1_name} vs {p2_name}"

            pred = m['prediction']
            predicted_winner = p1_name if pred['winner'] == 'p1' else p2_name

            actual_winner = None
            is_correct = None
            finish_time = None

            if m.get('status') == 'finished' and m.get('score'):
                score = m['score']
                actual_winner = p1_name if score['p1'] > score['p2'] else p2_name
                is_correct = (predicted_winner == actual_winner)
                finish_time = datetime.now(timezone.utc)

            start_time = m.get('startTime', datetime.now(timezone.utc).isoformat())

            cur.execute("""
                INSERT INTO predictions (
                    match_id, match_name, league, predicted_winner,
                    actual_winner, confidence, bet_type, p1_odds, p2_odds,
                    is_correct, match_start_time, match_finish_time
                ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
                ON CONFLICT (match_id) DO UPDATE SET
                    actual_winner = EXCLUDED.actual_winner,
                    is_correct = EXCLUDED.is_correct,
                    match_finish_time = EXCLUDED.match_finish_time,
                    updated_at = NOW()
            """, (
                match_id, match_name, m.get('league', ''),
                predicted_winner, actual_winner,
                pred.get('confidence', 50), pred.get('betType', 'medium'),
                m.get('odds', {}).get('p1Win', 1.8), m.get('odds', {}).get('p2Win', 1.8),
                is_correct, start_time, finish_time
            ))

            if cur.rowcount > 0:
                if is_correct is not None:
                    updated += 1
                else:
                    saved += 1

        except Exception as e:
            errors.append(f"{m.get('id', 'unknown')}: {str(e)[:50]}")

    conn.commit()
    cur.close()
    conn.close()

    return {
        'statusCode': 200,
        'headers': CORS_HEADERS,
        'body': json.dumps({
            'saved': saved,
            'updated': updated,
            'errors': errors if errors else None
        }, ensure_ascii=False)
    }
