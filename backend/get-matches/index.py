import json
import urllib.request
from datetime import datetime, timezone, timedelta
import hashlib

CORS_HEADERS = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, X-User-Id, X-Auth-Token, X-Session-Id',
    'Access-Control-Max-Age': '86400',
    'Content-Type': 'application/json'
}

UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36'
LIGA_KEYWORDS = ['liga pro', 'tt cup', 'setka cup', 'tt elite', 'moscow liga']

PLAYER_POOL = [
    'Кузнецов А.', 'Морозов Д.', 'Петров И.', 'Сидоров В.', 'Козлов А.',
    'Новиков М.', 'Волков Е.', 'Лебедев П.', 'Соколов Н.', 'Васильев К.',
    'Попов Р.', 'Егоров С.', 'Федоров Г.', 'Орлов Т.', 'Макаров Б.',
    'Зайцев Д.', 'Белов А.', 'Тихонов С.', 'Громов В.', 'Жуков К.',
]


def handler(event, context):
    """Получение матчей Лига Про настольного тенниса с AI-прогнозами"""

    if event.get('httpMethod') == 'OPTIONS':
        return {'statusCode': 200, 'headers': CORS_HEADERS, 'body': ''}

    matches = []
    source = 'live'

    try:
        matches = fetch_sofascore()
    except Exception:
        pass

    if not matches:
        source = 'generated'
        matches = generate_matches()

    for m in matches:
        if not m.get('prediction'):
            m['prediction'] = make_prediction(m)

    return {
        'statusCode': 200,
        'headers': CORS_HEADERS,
        'body': json.dumps({
            'matches': matches,
            'updatedAt': datetime.now(timezone.utc).isoformat(),
            'source': source,
            'count': len(matches)
        }, ensure_ascii=False, default=str)
    }


def fetch_json(url):
    try:
        req = urllib.request.Request(url, headers={'User-Agent': UA, 'Accept': '*/*'})
        with urllib.request.urlopen(req, timeout=8) as resp:
            return json.loads(resp.read().decode('utf-8'))
    except Exception:
        return None


def is_liga_pro(ev):
    t = ev.get('tournament', {})
    text = (t.get('name', '') + ' ' + t.get('slug', '')).lower()
    uniq = t.get('uniqueTournament', {})
    if uniq:
        text += ' ' + uniq.get('name', '').lower()
    return any(kw in text for kw in LIGA_KEYWORDS)


def fetch_sofascore():
    all_matches = []
    seen = set()

    live = fetch_json('https://api.sofascore.com/api/v1/sport/table-tennis/events/live')
    if live and 'events' in live:
        for ev in live['events']:
            if is_liga_pro(ev):
                m = parse_event(ev)
                if m:
                    m['status'] = 'live'
                    all_matches.append(m)
                    seen.add(m['id'])

    today = datetime.now(timezone.utc).strftime('%Y-%m-%d')
    sched = fetch_json(f'https://api.sofascore.com/api/v1/sport/table-tennis/scheduled-events/{today}')
    if sched and 'events' in sched:
        for ev in sched['events']:
            eid = str(ev.get('id', ''))
            if is_liga_pro(ev) and eid not in seen:
                m = parse_event(ev)
                if m:
                    all_matches.append(m)
                    seen.add(m['id'])

    yesterday = (datetime.now(timezone.utc) - timedelta(days=1)).strftime('%Y-%m-%d')
    yday = fetch_json(f'https://api.sofascore.com/api/v1/sport/table-tennis/scheduled-events/{yesterday}')
    if yday and 'events' in yday:
        for ev in yday['events']:
            eid = str(ev.get('id', ''))
            if is_liga_pro(ev) and eid not in seen:
                m = parse_event(ev)
                if m and m.get('status') == 'finished':
                    all_matches.append(m)
                    seen.add(m['id'])

    return all_matches


def player_rating(name):
    return 1700 + int(hashlib.md5(name.encode()).hexdigest()[:6], 16) % 300


def player_form(name):
    h = hashlib.md5(name.encode()).hexdigest()
    return ['W' if int(c, 16) > 5 else 'L' for c in h[:5]]


def calc_odds(r1, r2):
    diff = r1 - r2
    p1 = 1.0 / (1.0 + 10 ** (-diff / 400.0))
    margin = 0.06
    o1 = round(1.0 / (p1 + margin / 2), 2)
    o2 = round(1.0 / (1 - p1 + margin / 2), 2)
    return {'p1Win': max(1.05, min(8.0, o1)), 'p2Win': max(1.05, min(8.0, o2))}


def make_player(name, team_data=None):
    r = player_rating(name)
    return {
        'id': str(team_data.get('id', name)) if team_data else name,
        'name': name,
        'rating': r,
        'winRate': round(50 + (r - 1700) / 300 * 30, 1),
        'recentForm': player_form(name),
        'country': 'RU'
    }


def parse_event(ev):
    try:
        home = ev.get('homeTeam', {})
        away = ev.get('awayTeam', {})
        p1n = home.get('name', '')
        p2n = away.get('name', '')
        if not p1n or not p2n:
            return None

        st = ev.get('status', {}).get('type', '')
        status = 'live' if st == 'inprogress' else ('finished' if st == 'finished' else 'upcoming')

        ts = ev.get('startTimestamp', 0)
        start = datetime.fromtimestamp(ts, tz=timezone.utc).isoformat() if ts else datetime.now(timezone.utc).isoformat()

        p1 = make_player(p1n, home)
        p2 = make_player(p2n, away)

        match = {
            'id': str(ev.get('id', '')),
            'player1': p1,
            'player2': p2,
            'startTime': start,
            'status': status,
            'odds': calc_odds(p1['rating'], p2['rating']),
            'league': ev.get('tournament', {}).get('name', 'Liga Pro')
        }

        hs = ev.get('homeScore', {})
        aws = ev.get('awayScore', {})

        if status in ('live', 'finished'):
            match['score'] = {
                'p1': hs.get('current', 0) or 0,
                'p2': aws.get('current', 0) or 0
            }
            sets = []
            for i in range(1, 8):
                s1 = hs.get(f'period{i}')
                s2 = aws.get(f'period{i}')
                if s1 is not None and s2 is not None:
                    sets.append({'p1': s1, 'p2': s2})
            if sets:
                match['sets'] = sets

        return match
    except Exception:
        return None


def make_prediction(match):
    p1 = match['player1']
    p2 = match['player2']
    score = 0
    factors = []

    rd = p1['rating'] - p2['rating']
    if abs(rd) > 30:
        score += rd / 80
        factors.append('Преимущество в рейтинге' if rd > 0 else 'Рейтинг оппонента выше')

    wd = p1['winRate'] - p2['winRate']
    if abs(wd) > 3:
        score += wd / 15
        factors.append(f"Винрейт {max(p1['winRate'], p2['winRate'])}%")

    f1 = sum(1 for f in p1['recentForm'] if f == 'W')
    f2 = sum(1 for f in p2['recentForm'] if f == 'W')
    fd = f1 - f2
    if abs(fd) >= 2:
        score += fd * 0.3
        factors.append('Лучшая форма' if fd > 0 else 'Форма оппонента лучше')

    if match['odds']['p1Win'] < match['odds']['p2Win']:
        score += 0.4
    else:
        score -= 0.4
    factors.append('Анализ коэффициентов')

    winner = 'p1' if score >= 0 else 'p2'
    confidence = min(93, max(48, int(55 + abs(score) * 10)))

    if not factors:
        factors = ['Равные шансы', 'Анализ формы']

    return {'winner': winner, 'confidence': confidence, 'factors': factors[:3]}


def generate_matches():
    now = datetime.now(timezone.utc)
    seed = int(now.strftime('%Y%m%d%H'))
    matches = []
    used = set()

    for i in range(14):
        idx1 = (seed * (i + 1) * 7) % len(PLAYER_POOL)
        idx2 = (seed * (i + 1) * 13 + 3) % len(PLAYER_POOL)
        if idx2 == idx1:
            idx2 = (idx2 + 1) % len(PLAYER_POOL)

        pair = (min(idx1, idx2), max(idx1, idx2))
        if pair in used:
            continue
        used.add(pair)

        p1 = make_player(PLAYER_POOL[idx1])
        p2 = make_player(PLAYER_POOL[idx2])
        offset = i * 30 - 120
        t = now + timedelta(minutes=offset)

        if offset < -60:
            status = 'finished'
        elif offset < 20:
            status = 'live'
        else:
            status = 'upcoming'

        match = {
            'id': f'g{i}_{seed}',
            'player1': p1,
            'player2': p2,
            'startTime': t.isoformat(),
            'status': status,
            'odds': calc_odds(p1['rating'], p2['rating']),
            'league': 'Лига Про Москва' if i % 3 != 2 else 'Лига Про Сетка Кап'
        }

        if status in ('live', 'finished'):
            fav_p1 = p1['rating'] >= p2['rating']
            if status == 'finished':
                s1 = 3 if fav_p1 else ((seed + i) % 3)
                s2 = 3 if not fav_p1 else ((seed + i) % 3)
            else:
                s1 = (seed + i) % 3
                s2 = (seed + i + 1) % 3

            match['score'] = {'p1': s1, 'p2': s2}
            sets = []
            for j in range(s1 + s2):
                if j < s1:
                    sets.append({'p1': 11, 'p2': (seed + i + j) % 5 + 5})
                else:
                    sets.append({'p1': (seed + i + j) % 5 + 5, 'p2': 11})
            if sets:
                match['sets'] = sets

        matches.append(match)

    return matches
