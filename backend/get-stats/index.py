import json
import os
import psycopg2
from datetime import datetime, timezone, timedelta

CORS_HEADERS = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, X-User-Id, X-Auth-Token, X-Session-Id',
    'Access-Control-Max-Age': '86400',
    'Content-Type': 'application/json'
}


def handler(event, context):
    """Получение статистики прогнозов из БД"""

    if event.get('httpMethod') == 'OPTIONS':
        return {'statusCode': 200, 'headers': CORS_HEADERS, 'body': ''}

    db_url = os.environ.get('DATABASE_URL', '')
    if not db_url:
        return {
            'statusCode': 500,
            'headers': CORS_HEADERS,
            'body': json.dumps({'error': 'DATABASE_URL not configured'}, ensure_ascii=False)
        }

    params = event.get('queryStringParameters') or {}
    period = params.get('period', 'all')

    conn = psycopg2.connect(db_url)
    cur = conn.cursor()

    now = datetime.now(timezone.utc)
    date_filter = ''
    if period == 'today':
        date_filter = f"AND created_at >= '{(now - timedelta(days=1)).isoformat()}'"
    elif period == 'week':
        date_filter = f"AND created_at >= '{(now - timedelta(days=7)).isoformat()}'"
    elif period == 'month':
        date_filter = f"AND created_at >= '{(now - timedelta(days=30)).isoformat()}'"

    cur.execute(f"""
        SELECT
            COUNT(*) as total,
            COUNT(*) FILTER (WHERE is_correct = true) as correct,
            COUNT(*) FILTER (WHERE is_correct = false) as incorrect,
            COUNT(*) FILTER (WHERE is_correct IS NULL) as pending,
            AVG((p1_odds + p2_odds) / 2) as avg_odds,
            COUNT(*) FILTER (WHERE bet_type = 'strong') as strong_count,
            COUNT(*) FILTER (WHERE bet_type = 'medium') as medium_count,
            COUNT(*) FILTER (WHERE bet_type = 'risky') as risky_count
        FROM predictions
        WHERE 1=1 {date_filter}
    """)

    row = cur.fetchone()
    total = row[0] or 0
    correct = row[1] or 0
    incorrect = row[2] or 0
    pending = row[3] or 0
    avg_odds = float(row[4] or 1.8)
    strong_count = row[5] or 0
    medium_count = row[6] or 0
    risky_count = row[7] or 0

    win_rate = round((correct / total * 100), 1) if total > 0 else 0
    roi = round((avg_odds * win_rate / 100 - 1) * 100, 1) if total > 0 else 0

    cur.execute(f"""
        SELECT
            is_correct
        FROM predictions
        WHERE is_correct IS NOT NULL {date_filter}
        ORDER BY match_finish_time DESC
        LIMIT 50
    """)
    recent = cur.fetchall()
    streak = 0
    for r in recent:
        if r[0]:
            streak += 1
        else:
            break

    cur.execute(f"""
        SELECT
            league,
            COUNT(*) as total,
            COUNT(*) FILTER (WHERE is_correct = true) as correct
        FROM predictions
        WHERE is_correct IS NOT NULL {date_filter}
        GROUP BY league
        ORDER BY correct DESC
    """)
    leagues_data = []
    for row in cur.fetchall():
        league_name = row[0]
        league_total = row[1]
        league_correct = row[2]
        league_wr = round((league_correct / league_total * 100), 1) if league_total > 0 else 0
        leagues_data.append({
            'league': league_name,
            'winRate': league_wr,
            'total': league_total,
            'correct': league_correct
        })

    cur.execute(f"""
        SELECT
            DATE(created_at) as day,
            COUNT(*) as total,
            COUNT(*) FILTER (WHERE is_correct = true) as correct
        FROM predictions
        WHERE is_correct IS NOT NULL {date_filter}
        GROUP BY DATE(created_at)
        ORDER BY day DESC
        LIMIT 30
    """)
    daily_data = []
    for row in cur.fetchall():
        day_str = row[0].strftime('%Y-%m-%d')
        day_total = row[1]
        day_correct = row[2]
        day_wr = round((day_correct / day_total * 100), 1) if day_total > 0 else 0
        daily_data.append({
            'date': day_str,
            'winRate': day_wr,
            'total': day_total,
            'correct': day_correct
        })

    cur.close()
    conn.close()

    return {
        'statusCode': 200,
        'headers': CORS_HEADERS,
        'body': json.dumps({
            'period': period,
            'total': total,
            'correct': correct,
            'incorrect': incorrect,
            'pending': pending,
            'winRate': win_rate,
            'roi': roi,
            'avgOdds': round(avg_odds, 2),
            'streak': streak,
            'strongCount': strong_count,
            'mediumCount': medium_count,
            'riskyCount': risky_count,
            'byLeague': leagues_data,
            'daily': daily_data,
            'updatedAt': now.isoformat()
        }, ensure_ascii=False)
    }
