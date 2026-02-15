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

MATCHES_URL = 'https://functions.poehali.dev/6a9f6c04-269b-4b4b-9151-6645433dba77'


def handler(event, context):
    """Отправка прогнозов матчей Лига Про в Telegram"""

    if event.get('httpMethod') == 'OPTIONS':
        return {'statusCode': 200, 'headers': CORS_HEADERS, 'body': ''}

    token = os.environ.get('TELEGRAM_BOT_TOKEN', '')
    chat_id = os.environ.get('TELEGRAM_CHAT_ID', '')

    if not token or not chat_id:
        return {
            'statusCode': 400,
            'headers': CORS_HEADERS,
            'body': json.dumps({'error': 'Telegram не настроен. Добавьте TELEGRAM_BOT_TOKEN и TELEGRAM_CHAT_ID.'}, ensure_ascii=False)
        }

    body = {}
    if event.get('body'):
        body = json.loads(event['body'])

    mode = body.get('mode', 'predictions')

    matches_data = fetch_matches()
    if not matches_data:
        return {
            'statusCode': 500,
            'headers': CORS_HEADERS,
            'body': json.dumps({'error': 'Не удалось загрузить матчи'}, ensure_ascii=False)
        }

    matches = matches_data.get('matches', [])

    if mode == 'predictions':
        text = build_predictions_message(matches)
    elif mode == 'results':
        text = build_results_message(matches)
    else:
        text = build_predictions_message(matches)

    ok = send_telegram(token, chat_id, text)

    return {
        'statusCode': 200 if ok else 500,
        'headers': CORS_HEADERS,
        'body': json.dumps({
            'success': ok,
            'message': 'Отправлено в Telegram!' if ok else 'Ошибка отправки',
            'sentAt': datetime.now(timezone.utc).isoformat()
        }, ensure_ascii=False)
    }


def fetch_matches():
    try:
        req = urllib.request.Request(MATCHES_URL)
        with urllib.request.urlopen(req, timeout=10) as resp:
            return json.loads(resp.read().decode('utf-8'))
    except Exception:
        return None


def confidence_bar(c):
    filled = round(c / 10)
    return '▓' * filled + '░' * (10 - filled)


def build_predictions_message(matches):
    upcoming = [m for m in matches if m.get('status') in ('upcoming', 'live') and m.get('prediction')]
    upcoming.sort(key=lambda m: m.get('prediction', {}).get('confidence', 0), reverse=True)

    now = datetime.now(timezone.utc)
    lines = [f'🏓 *TT Predict — Прогнозы*', f'📅 {now.strftime("%d.%m.%Y %H:%M")} UTC', '']

    if not upcoming:
        lines.append('_Нет активных прогнозов_')
        return '\n'.join(lines)

    live = [m for m in upcoming if m['status'] == 'live']
    soon = [m for m in upcoming if m['status'] == 'upcoming']

    if live:
        lines.append('🔴 *LIVE*')
        for m in live[:5]:
            lines.append(format_prediction(m))
        lines.append('')

    if soon:
        lines.append('⏳ *Ожидаемые*')
        for m in soon[:8]:
            lines.append(format_prediction(m))

    high_conf = [m for m in upcoming if m['prediction']['confidence'] >= 75]
    if high_conf:
        lines.append('')
        lines.append(f'💎 Топ-прогнозы (>75%): *{len(high_conf)}* матчей')

    return '\n'.join(lines)


def format_prediction(m):
    p = m['prediction']
    winner_name = m['player1']['name'] if p['winner'] == 'p1' else m['player2']['name']
    odds = m['odds']['p1Win'] if p['winner'] == 'p1' else m['odds']['p2Win']
    conf = p['confidence']

    status_icon = '🔴' if m['status'] == 'live' else '⏰'
    time_str = ''
    try:
        t = datetime.fromisoformat(m['startTime'].replace('Z', '+00:00'))
        time_str = t.strftime('%H:%M')
    except Exception:
        pass

    conf_emoji = '🟢' if conf >= 75 else ('🟡' if conf >= 60 else '⚪')

    return (
        f'{status_icon} `{time_str}` *{m["player1"]["name"]}* vs *{m["player2"]["name"]}*\n'
        f'   {conf_emoji} Прогноз: *{winner_name}* — {conf}% | Кф. {odds:.2f}\n'
        f'   `{confidence_bar(conf)}`'
    )


def build_results_message(matches):
    finished = [m for m in matches if m.get('status') == 'finished' and m.get('prediction') and m.get('score')]
    now = datetime.now(timezone.utc)
    lines = [f'🏆 *TT Predict — Результаты*', f'📅 {now.strftime("%d.%m.%Y %H:%M")} UTC', '']

    if not finished:
        lines.append('_Нет завершённых матчей_')
        return '\n'.join(lines)

    correct = 0
    total = len(finished)

    for m in finished:
        p = m['prediction']
        predicted_p1 = p['winner'] == 'p1'
        p1_won = m['score']['p1'] > m['score']['p2']
        is_correct = predicted_p1 == p1_won
        if is_correct:
            correct += 1

        icon = '✅' if is_correct else '❌'
        winner_name = m['player1']['name'] if predicted_p1 else m['player2']['name']
        score_str = f"{m['score']['p1']}:{m['score']['p2']}"

        lines.append(
            f'{icon} *{m["player1"]["name"]}* vs *{m["player2"]["name"]}* — {score_str}\n'
            f'   Прогноз: {winner_name} ({p["confidence"]}%)'
        )

    winrate = round(correct / total * 100, 1)
    lines.append('')
    lines.append(f'📊 Итого: *{correct}/{total}* ({winrate}%)')

    return '\n'.join(lines)


def send_telegram(token, chat_id, text):
    url = f'https://api.telegram.org/bot{token}/sendMessage'
    payload = json.dumps({
        'chat_id': chat_id,
        'text': text,
        'parse_mode': 'Markdown',
        'disable_web_page_preview': True
    }).encode('utf-8')

    try:
        req = urllib.request.Request(url, data=payload, headers={'Content-Type': 'application/json'})
        with urllib.request.urlopen(req, timeout=10) as resp:
            result = json.loads(resp.read().decode('utf-8'))
            return result.get('ok', False)
    except Exception:
        return False
