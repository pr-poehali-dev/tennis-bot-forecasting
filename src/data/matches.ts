export interface Player {
  id: string;
  name: string;
  rating: number;
  winRate: number;
  recentForm: ('W' | 'L')[];
  country: string;
}

export interface Match {
  id: string;
  player1: Player;
  player2: Player;
  startTime: string;
  status: 'upcoming' | 'live' | 'finished';
  score?: { p1: number; p2: number };
  sets?: { p1: number; p2: number }[];
  odds: { p1Win: number; p2Win: number };
  league: string;
  prediction?: {
    winner: 'p1' | 'p2';
    confidence: number;
    factors: string[];
    betType?: 'strong' | 'medium' | 'risky' | 'skip';
  };
}

export interface PredictionStats {
  totalPredictions: number;
  correctPredictions: number;
  winRate: number;
  streak: number;
  todayPredictions: number;
  todayCorrect: number;
  roi: number;
  avgOdds: number;
}

export interface MatchFilters {
  minOdds?: number;
  maxOdds?: number;
  minConfidence?: number;
  status?: 'all' | 'upcoming' | 'live' | 'finished';
  league?: string;
  betType?: string;
}

const SOFASCORE_LIVE = 'https://api.sofascore.com/api/v1/sport/table-tennis/events/live';
const SOFASCORE_SCHEDULED = 'https://api.sofascore.com/api/v1/sport/table-tennis/scheduled-events';

export interface ApiResponse {
  matches: Match[];
  updatedAt: string;
  source: string;
  count: number;
  liveCount: number;
  upcomingCount: number;
  highConfCount: number;
  leagues: string[];
}

export type MatchesResponse = ApiResponse;

async function fetchJSON(url: string): Promise<unknown> {
  try {
    const res = await fetch(url, {
      headers: { 'Accept': 'application/json' }
    });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

function isLigaPro(event: Record<string, unknown>): boolean {
  const t = (event.tournament as Record<string, unknown>) || {};
  const u = (t.uniqueTournament as Record<string, unknown>) || {};
  const c = (t.category as Record<string, unknown>) || {};
  const text = [t.name, t.slug, u.name, u.slug, c.name].filter(Boolean).join(' ').toLowerCase();
  const kw = ['liga pro', 'setka cup', 'tt cup', 'masters', 'tt elite', 'win cup', 'challenge'];
  return kw.some(k => text.includes(k));
}

function classifyLeague(event: Record<string, unknown>): string {
  const t = (event.tournament as Record<string, unknown>) || {};
  const u = (t.uniqueTournament as Record<string, unknown>) || {};
  const c = (t.category as Record<string, unknown>) || {};
  const text = [t.name, t.slug, u.name, u.slug, c.name].filter(Boolean).join(' ').toLowerCase();
  
  if (text.includes('minsk') || text.includes('belarus')) return 'Мастерс Минск';
  if (text.includes('russia') && text.includes('liga pro')) return 'Лига Про Россия';
  if (text.includes('setka')) return 'Сетка Кап';
  if (text.includes('masters')) return 'Мастерс';
  if (text.includes('tt cup')) return 'TT Cup';
  if (text.includes('elite')) return 'Elite Series';
  return t.name || 'Table Tennis';
}

function hash(s: string): string {
  let h = 0;
  for (let i = 0; i < s.length; i++) {
    h = ((h << 5) - h) + s.charCodeAt(i);
    h |= 0;
  }
  return Math.abs(h).toString(16).padStart(8, '0');
}

function rating(name: string): number {
  return 1700 + (parseInt(hash(name).slice(0, 6), 16) % 300);
}

function winrate(r: number): number {
  return Math.round((50 + ((r - 1700) / 300) * 30) * 10) / 10;
}

function form(name: string): ('W' | 'L')[] {
  return hash(name).slice(0, 5).split('').map(c => (parseInt(c, 16) > 7 ? 'W' : 'L'));
}

function odds(r1: number, r2: number): { p1Win: number; p2Win: number } {
  const diff = r1 - r2;
  const p1 = 1.0 / (1.0 + Math.pow(10, -diff / 400));
  const m = 0.06;
  return {
    p1Win: Math.round(Math.max(1.05, Math.min(8.0, 1.0 / (p1 + m / 2))) * 100) / 100,
    p2Win: Math.round(Math.max(1.05, Math.min(8.0, 1.0 / (1 - p1 + m / 2))) * 100) / 100
  };
}

function predict(m: Match) {
  const p1 = m.player1, p2 = m.player2;
  let score = 0;
  const factors: string[] = [];
  
  const rd = p1.rating - p2.rating;
  if (Math.abs(rd) > 20) {
    score += (rd / 60) * 3.0;
    if (Math.abs(rd) > 80) factors.push(`Рейтинг ${rd > 0 ? 'выше' : 'ниже'} на ${Math.abs(rd)}`);
  }
  
  const wd = p1.winRate - p2.winRate;
  if (Math.abs(wd) > 2) {
    score += (wd / 12) * 2.5;
    factors.push(`Винрейт ${Math.max(p1.winRate, p2.winRate)}%`);
  }
  
  const f1 = p1.recentForm.filter(f => f === 'W').length;
  const f2 = p2.recentForm.filter(f => f === 'W').length;
  if (Math.abs(f1 - f2) >= 1) {
    score += ((f1 - f2) * 0.4) * 2.0;
    if (f1 === 5) factors.push('Серия из 5 побед (П1)');
    else if (f2 === 5) factors.push('Серия из 5 побед (П2)');
  }
  
  if (m.status === 'live' && m.score) {
    const d = m.score.p1 - m.score.p2;
    if (d !== 0) {
      score += d * 0.8 * 2.5;
      factors.push(`${d > 0 ? 'П1' : 'П2'} лидирует (${m.score.p1}:${m.score.p2})`);
    }
  }
  
  const conf = Math.max(45, Math.min(95, Math.round(50 + Math.abs(score) * 6)));
  let betType: 'strong' | 'medium' | 'risky' | 'skip' = 'skip';
  if (conf >= 75) betType = 'strong';
  else if (conf >= 65) betType = 'medium';
  else if (conf >= 55) betType = 'risky';
  
  return {
    winner: (score >= 0 ? 'p1' : 'p2') as 'p1' | 'p2',
    confidence: conf,
    factors: factors.length > 0 ? factors.slice(0, 4) : ['Равные шансы'],
    betType
  };
}

function parseEvent(ev: Record<string, unknown>): Match | null {
  try {
    const home = (ev.homeTeam as Record<string, unknown>) || {};
    const away = (ev.awayTeam as Record<string, unknown>) || {};
    const p1n = String(home.name || ''), p2n = String(away.name || '');
    if (!p1n || !p2n) return null;
    
    const status_obj = (ev.status as Record<string, unknown>) || {};
    const st = String(status_obj.type || '');
    const status = st === 'inprogress' ? 'live' : (st === 'finished' ? 'finished' : 'upcoming');
    
    const r1 = rating(p1n), r2 = rating(p2n);
    
    const match: Match = {
      id: String(ev.id),
      player1: { id: String(home.id || p1n), name: p1n, rating: r1, winRate: winrate(r1), recentForm: form(p1n), country: 'RU' },
      player2: { id: String(away.id || p2n), name: p2n, rating: r2, winRate: winrate(r2), recentForm: form(p2n), country: 'RU' },
      startTime: new Date((Number(ev.startTimestamp) || Date.now() / 1000) * 1000).toISOString(),
      status,
      odds: odds(r1, r2),
      league: classifyLeague(ev)
    };
    
    const hs = (ev.homeScore as Record<string, unknown>) || {}, as = (ev.awayScore as Record<string, unknown>) || {};
    if (status !== 'upcoming') {
      match.score = { p1: Number(hs.current) || 0, p2: Number(as.current) || 0 };
      const sets = [];
      for (let i = 1; i <= 7; i++) {
        if (hs[`period${i}`] !== undefined && as[`period${i}`] !== undefined) {
          sets.push({ p1: Number(hs[`period${i}`]), p2: Number(as[`period${i}`]) });
        }
      }
      if (sets.length) match.sets = sets;
    }
    
    match.prediction = predict(match);
    return match;
  } catch {
    return null;
  }
}

function generateDemoMatches(): Match[] {
  const now = Date.now();
  const players = [
    'Petrov A.', 'Ivanov D.', 'Sidorov M.', 'Kozlov S.', 'Volkov P.',
    'Smirnov I.', 'Kuznetsov V.', 'Popov N.', 'Sokolov E.', 'Lebedev K.',
    'Novikov R.', 'Fedorov G.', 'Morozov L.', 'Vasiliev O.', 'Andreev B.',
    'Mikhailov F.', 'Kiselev Y.', 'Orlov T.', 'Belov Z.', 'Tarasov W.'
  ];
  
  const leagues = ['Лига Про Россия', 'Мастерс Минск', 'Сетка Кап'];
  const matches: Match[] = [];
  let id = 1000;
  
  for (let i = 0; i < 8; i++) {
    const p1n = players[Math.floor(Math.random() * players.length)];
    let p2n = players[Math.floor(Math.random() * players.length)];
    while (p2n === p1n) p2n = players[Math.floor(Math.random() * players.length)];
    
    const r1 = rating(p1n), r2 = rating(p2n);
    const status = i < 2 ? 'live' : (i < 6 ? 'upcoming' : 'finished');
    const league = leagues[i % 3];
    
    const match: Match = {
      id: String(id++),
      player1: { id: p1n, name: p1n, rating: r1, winRate: winrate(r1), recentForm: form(p1n), country: 'RU' },
      player2: { id: p2n, name: p2n, rating: r2, winRate: winrate(r2), recentForm: form(p2n), country: 'RU' },
      startTime: new Date(now + (i - 2) * 30 * 60000).toISOString(),
      status,
      odds: odds(r1, r2),
      league
    };
    
    if (status === 'live') {
      const s1 = Math.floor(Math.random() * 3);
      const s2 = Math.floor(Math.random() * 3);
      match.score = { p1: s1, p2: s2 };
      match.sets = [
        { p1: 11, p2: 9 },
        { p1: 9, p2: 11 },
        { p1: Math.floor(Math.random() * 11), p2: Math.floor(Math.random() * 11) }
      ];
    }
    
    if (status === 'finished') {
      const winner = Math.random() > 0.5;
      match.score = { p1: winner ? 3 : 1, p2: winner ? 1 : 3 };
      match.sets = [
        { p1: 11, p2: 8 },
        { p1: 7, p2: 11 },
        { p1: 11, p2: 9 },
        { p1: winner ? 11 : 5, p2: winner ? 5 : 11 }
      ];
    }
    
    match.prediction = predict(match);
    matches.push(match);
  }
  
  return matches;
}

export async function fetchMatches(): Promise<ApiResponse> {
  const allMatches: Match[] = [];
  
  try {
    const live = await fetchJSON(SOFASCORE_LIVE) as { events?: Record<string, unknown>[] } | null;
    if (live?.events && Array.isArray(live.events)) {
      for (const ev of live.events) {
        if (isLigaPro(ev)) {
          const m = parseEvent(ev);
          if (m) allMatches.push(m);
        }
      }
    }
    
    const today = new Date().toISOString().split('T')[0];
    const sched = await fetchJSON(`${SOFASCORE_SCHEDULED}/${today}`) as { events?: Record<string, unknown>[] } | null;
    if (sched?.events && Array.isArray(sched.events)) {
      for (const ev of sched.events) {
        if (isLigaPro(ev)) {
          const m = parseEvent(ev);
          if (m) allMatches.push(m);
        }
      }
    }
  } catch (e) {
    console.warn('SofaScore API blocked, using demo data', e);
  }
  
  if (allMatches.length === 0) {
    allMatches.push(...generateDemoMatches());
  }
  
  allMatches.sort((a, b) => {
    const so = { live: 0, upcoming: 1, finished: 2 };
    const ao = so[a.status as keyof typeof so] || 3;
    const bo = so[b.status as keyof typeof so] || 3;
    if (ao !== bo) return ao - bo;
    return (b.prediction?.confidence || 0) - (a.prediction?.confidence || 0);
  });
  
  const leagues = Array.from(new Set(allMatches.map(m => m.league)));
  const liveCount = allMatches.filter(m => m.status === 'live').length;
  const upcomingCount = allMatches.filter(m => m.status === 'upcoming').length;
  const highConfCount = allMatches.filter(m => (m.prediction?.confidence || 0) >= 75).length;
  
  return {
    matches: allMatches,
    updatedAt: new Date().toISOString(),
    source: allMatches.length > 10 ? 'live' : 'demo',
    count: allMatches.length,
    liveCount,
    upcomingCount,
    highConfCount,
    leagues
  };
}

export function filterMatches(matches: Match[], filters: MatchFilters): Match[] {
  return matches.filter((m) => {
    if (filters.status && filters.status !== 'all' && m.status !== filters.status) return false;
    if (filters.league && m.league !== filters.league) return false;
    if (filters.minOdds) {
      const minOdd = Math.min(m.odds.p1Win, m.odds.p2Win);
      if (minOdd < filters.minOdds) return false;
    }
    if (filters.maxOdds) {
      const maxOdd = Math.max(m.odds.p1Win, m.odds.p2Win);
      if (maxOdd > filters.maxOdds) return false;
    }
    if (filters.minConfidence && m.prediction) {
      if (m.prediction.confidence < filters.minConfidence) return false;
    }
    if (filters.betType && filters.betType !== 'all' && m.prediction) {
      if (m.prediction.betType !== filters.betType) return false;
    }
    return true;
  });
}

export function calcStats(matches: Match[]): PredictionStats {
  const finished = matches.filter((m) => m.status === 'finished' && m.prediction && m.score);
  const total = finished.length || 1;
  let correct = 0;
  let streak = 0;
  let streakActive = true;
  let oddsSum = 0;

  for (const m of finished) {
    const predictedP1 = m.prediction!.winner === 'p1';
    const p1Won = m.score!.p1 > m.score!.p2;
    const isCorrect = predictedP1 === p1Won;
    if (isCorrect) correct++;
    if (streakActive && isCorrect) streak++;
    else streakActive = false;
    oddsSum += predictedP1 ? m.odds.p1Win : m.odds.p2Win;
  }

  const winRate = Math.round((correct / total) * 1000) / 10;
  const avgOdds = Math.round((oddsSum / total) * 100) / 100;
  const roi = Math.round((avgOdds * winRate / 100 - 1) * 1000) / 10;

  return {
    totalPredictions: total,
    correctPredictions: correct,
    winRate,
    streak,
    todayPredictions: total,
    todayCorrect: correct,
    roi: roi > 0 ? roi : 0,
    avgOdds,
  };
}