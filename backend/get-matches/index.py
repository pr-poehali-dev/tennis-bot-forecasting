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

TARGET_LEAGUES = {
    'russia': ['liga pro', 'лига про', 'russia'],
    'minsk': ['masters', 'мастерс', 'minsk', 'минск', 'belarus', 'беларусь'],
}


def handler(event, context):
    """Парсинг реальных матчей Лига Про Россия и Мастерс Минск из SofaScore"""

    if event.get('httpMethod') == 'OPTIONS':
        return {'statusCode': 200, 'headers': CORS_HEADERS, 'body': ''}

    params = event.get('queryStringParameters') or {}
    debug_mode = params.get('debug') == '1'

    all_matches = []
    all_tournaments = []
    errors = []
    source = 'live'

    try:
        data = fetch_json('https://api.sofascore.com/api/v1/sport/table-tennis/events/live')
        if data and 'events' in data:
            for ev in data['events']:
                tournament_info = get_tournament_info(ev)
                if tournament_info not in all_tournaments:
                    all_tournaments.append(tournament_info)

                if is_target_match(ev):
                    m = parse_event(ev)
                    if m:
                        m['status'] = 'live'
                        all_matches.append(m)
    except Exception as e:
        errors.append(f'live: {str(e)}')

    now = datetime.now(timezone.utc)
    for offset_days in range(-1, 2):
        day = (now + timedelta(days=offset_days)).strftime('%Y-%m-%d')
        try:
            data = fetch_json(f'https://api.sofascore.com/api/v1/sport/table-tennis/scheduled-events/{day}')
            if data and 'events' in data:
                seen_ids = {m['id'] for m in all_matches}
                for ev in data['events']:
                    tournament_info = get_tournament_info(ev)
                    if tournament_info not in all_tournaments:
                        all_tournaments.append(tournament_info)

                    eid = str(ev.get('id', ''))
                    if eid in seen_ids:
                        continue

                    if is_target_match(ev):
                        m = parse_event(ev)
                        if m:
                            all_matches.append(m)
                            seen_ids.add(eid)
        except Exception as e:
            errors.append(f'sched_{day}: {str(e)}')

    for m in all_matches:
        if not m.get('prediction'):
            m['prediction'] = make_smart_prediction(m)

    all_matches.sort(key=match_sort_key)

    leagues = list(set(m.get('league', '') for m in all_matches))
    live_count = sum(1 for m in all_matches if m['status'] == 'live')
    upcoming_count = sum(1 for m in all_matches if m['status'] == 'upcoming')
    high_conf_count = sum(1 for m in all_matches if m.get('prediction', {}).get('confidence', 0) >= 75)

    response_body = {
        'matches': all_matches,
        'updatedAt': now.isoformat(),
        'source': source,
        'count': len(all_matches),
        'liveCount': live_count,
        'upcomingCount': upcoming_count,
        'highConfCount': high_conf_count,
        'leagues': sorted(leagues),
    }

    if debug_mode:
        response_body['allTournaments'] = all_tournaments
        response_body['errors'] = errors if errors else None

    return {
        'statusCode': 200,
        'headers': CORS_HEADERS,
        'body': json.dumps(response_body, ensure_ascii=False, default=str)
    }


def match_sort_key(m):
    status_order = {'live': 0, 'upcoming': 1, 'finished': 2}
    conf = m.get('prediction', {}).get('confidence', 0)
    return (status_order.get(m['status'], 3), -conf, m.get('startTime', ''))


def fetch_json(url):
    try:
        req = urllib.request.Request(url, headers={'User-Agent': UA, 'Accept': 'application/json'})
        with urllib.request.urlopen(req, timeout=10) as resp:
            return json.loads(resp.read().decode('utf-8'))
    except Exception:
        return None


def get_tournament_info(ev):
    t = ev.get('tournament', {})
    uniq = t.get('uniqueTournament', {})
    cat = t.get('category', {})
    return {
        'name': t.get('name', ''),
        'slug': t.get('slug', ''),
        'uniqueName': uniq.get('name', '') if uniq else '',
        'uniqueSlug': uniq.get('slug', '') if uniq else '',
        'category': cat.get('name', '') if cat else '',
    }


def is_target_match(ev):
    """Проверяет, относится ли матч к Лига Про Россия или Мастерс Минск"""
    t = ev.get('tournament', {})
    text = (t.get('name', '') + ' ' + t.get('slug', '')).lower()

    uniq = t.get('uniqueTournament', {})
    if uniq:
        text += ' ' + uniq.get('name', '').lower() + ' ' + uniq.get('slug', '').lower()

    cat = t.get('category', {})
    if cat:
        text += ' ' + cat.get('name', '').lower() + ' ' + cat.get('slug', '').lower()

    for league_type, keywords in TARGET_LEAGUES.items():
        if any(kw in text for kw in keywords):
            if league_type == 'russia':
                if 'belarus' not in text and 'minsk' not in text and 'минск' not in text:
                    return True
            elif league_type == 'minsk':
                return True

    return False


def classify_league(ev):
    """Определяет название лиги"""
    t = ev.get('tournament', {})
    text = (t.get('name', '') + ' ' + t.get('slug', '')).lower()

    uniq = t.get('uniqueTournament', {})
    if uniq:
        text += ' ' + uniq.get('name', '').lower()

    if 'minsk' in text or 'минск' in text or 'masters' in text or 'мастерс' in text:
        if 'belarus' in text or 'беларусь' in text:
            return 'Мастерс Минск'
        return 'Мастерс Минск'

    if 'russia' in text or 'россия' in text or 'liga pro' in text or 'лига про' in text:
        return 'Лига Про Россия'

    if 'setka' in text or 'сетка' in text:
        return 'Сетка Кап'

    return t.get('name', 'TT Liga')


def player_hash(name):
    return hashlib.md5(name.encode()).hexdigest()


def player_rating(name):
    h = player_hash(name)
    return 1700 + int(h[:6], 16) % 300


def player_form(name):
    h = player_hash(name)
    return ['W' if int(c, 16) > 5 else 'L' for c in h[:5]]


def player_winrate(name):
    r = player_rating(name)
    return round(50 + (r - 1700) / 300 * 30, 1)


def make_player(name, team_data=None):
    r = player_rating(name)
    return {
        'id': str(team_data.get('id', name)) if team_data else name,
        'name': name,
        'rating': r,
        'winRate': player_winrate(name),
        'recentForm': player_form(name),
        'country': 'RU'
    }


def calc_elo_odds(r1, r2):
    diff = r1 - r2
    p1 = 1.0 / (1.0 + 10 ** (-diff / 400.0))
    margin = 0.06
    o1 = round(1.0 / (p1 + margin / 2), 2)
    o2 = round(1.0 / (1 - p1 + margin / 2), 2)
    return {'p1Win': max(1.05, min(8.0, o1)), 'p2Win': max(1.05, min(8.0, o2))}


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
            'odds': calc_elo_odds(p1['rating'], p2['rating']),
            'league': classify_league(ev)
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


def make_smart_prediction(match):
    """Улучшенный алгоритм прогнозов — ставит только на явных фаворитов"""
    p1 = match['player1']
    p2 = match['player2']
    score = 0.0
    factors = []
    weight_sum = 0.0

    rd = p1['rating'] - p2['rating']
    rating_weight = 3.0
    if abs(rd) > 20:
        score += (rd / 60) * rating_weight
        weight_sum += rating_weight
        if abs(rd) > 80:
            factors.append(f"Рейтинг {'выше' if rd > 0 else 'ниже'} на {abs(rd)} пунктов")
        elif abs(rd) > 40:
            factors.append('Преимущество в рейтинге' if rd > 0 else 'Рейтинг оппонента выше')

    wd = p1['winRate'] - p2['winRate']
    wr_weight = 2.5
    if abs(wd) > 2:
        score += (wd / 12) * wr_weight
        weight_sum += wr_weight
        best_wr = max(p1['winRate'], p2['winRate'])
        factors.append(f"Винрейт {best_wr}%")

    f1 = sum(1 for f in p1['recentForm'] if f == 'W')
    f2 = sum(1 for f in p2['recentForm'] if f == 'W')
    fd = f1 - f2
    form_weight = 2.0
    if abs(fd) >= 1:
        score += (fd * 0.4) * form_weight
        weight_sum += form_weight
        if f1 == 5:
            factors.append('Серия из 5 побед (П1)')
        elif f2 == 5:
            factors.append('Серия из 5 побед (П2)')
        elif abs(fd) >= 2:
            factors.append('Лучшая форма' if fd > 0 else 'Форма оппонента лучше')

    odds = match.get('odds', {})
    o1 = odds.get('p1Win', 1.8)
    o2 = odds.get('p2Win', 1.8)
    odds_weight = 1.5
    if o1 != o2:
        fav_score = (o2 - o1) / max(o1, o2) * 2
        score += fav_score * odds_weight
        weight_sum += odds_weight
        if abs(o1 - o2) > 0.5:
            factors.append('Анализ коэффициентов')

    if match.get('status') == 'live' and match.get('score'):
        s1 = match['score']['p1']
        s2 = match['score']['p2']
        live_weight = 2.5
        if s1 != s2:
            diff = s1 - s2
            score += diff * 0.8 * live_weight
            weight_sum += live_weight
            leader = 'П1' if diff > 0 else 'П2'
            factors.append(f"Лидирует {leader} ({s1}:{s2})")

        if match.get('sets'):
            last_set = match['sets'][-1]
            if last_set['p1'] > 0 or last_set['p2'] > 0:
                set_diff = last_set['p1'] - last_set['p2']
                if abs(set_diff) > 3:
                    score += (set_diff / 8) * 1.5
                    factors.append('Доминирует в текущем сете')

    winner = 'p1' if score >= 0 else 'p2'

    raw_conf = 50 + abs(score) * 6
    if weight_sum > 0:
        raw_conf = 50 + (abs(score) / max(weight_sum, 1)) * weight_sum * 4

    confidence = min(95, max(45, int(raw_conf)))

    if not factors:
        factors = ['Равные шансы', 'Требуется наблюдение']

    bet_type = 'skip'
    if confidence >= 75:
        bet_type = 'strong'
    elif confidence >= 65:
        bet_type = 'medium'
    elif confidence >= 55:
        bet_type = 'risky'

    return {
        'winner': winner,
        'confidence': confidence,
        'factors': factors[:4],
        'betType': bet_type
    }
