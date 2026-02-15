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
  const ratingWeight = 4.0;
  if (Math.abs(rd) > 10) {
    score += (rd / 50) * ratingWeight;
    if (Math.abs(rd) > 100) {
      factors.push(`Большое преимущество в рейтинге (${Math.abs(rd)} очков)`);
    } else if (Math.abs(rd) > 50) {
      factors.push(`Преимущество в рейтинге (${Math.abs(rd)} очков)`);
    }
  }
  
  const wd = p1.winRate - p2.winRate;
  const winrateWeight = 3.5;
  if (Math.abs(wd) > 1) {
    score += (wd / 10) * winrateWeight;
    if (Math.abs(wd) > 5) {
      const leader = wd > 0 ? p1 : p2;
      factors.push(`Высокий винрейт ${leader.name.split(' ')[0]} (${Math.max(p1.winRate, p2.winRate)}%)`);
    }
  }
  
  const f1 = p1.recentForm.filter(f => f === 'W').length;
  const f2 = p2.recentForm.filter(f => f === 'W').length;
  const formWeight = 2.8;
  if (Math.abs(f1 - f2) >= 1) {
    score += ((f1 - f2) * 0.5) * formWeight;
    if (f1 >= 4) {
      factors.push(`${p1.name.split(' ')[0]} в отличной форме (${f1}/5 побед)`);
    } else if (f2 >= 4) {
      factors.push(`${p2.name.split(' ')[0]} в отличной форме (${f2}/5 побед)`);
    } else if (f1 <= 1) {
      factors.push(`${p1.name.split(' ')[0]} в слабой форме (${f1}/5 побед)`);
    } else if (f2 <= 1) {
      factors.push(`${p2.name.split(' ')[0]} в слабой форме (${f2}/5 побед)`);
    }
  }
  
  const oddsWeight = 1.2;
  const oddsDiff = m.odds.p1Win - m.odds.p2Win;
  if (Math.abs(oddsDiff) > 0.5) {
    score += (oddsDiff > 0 ? -1 : 1) * oddsWeight;
    const favorite = oddsDiff < 0 ? p1.name.split(' ')[0] : p2.name.split(' ')[0];
    const favoriteOdds = Math.min(m.odds.p1Win, m.odds.p2Win);
    if (favoriteOdds < 1.5) {
      factors.push(`${favorite} явный фаворит (коэф. ${favoriteOdds})`);
    }
  }
  
  if (m.status === 'live' && m.score) {
    const d = m.score.p1 - m.score.p2;
    const liveWeight = 5.0;
    if (d !== 0) {
      score += d * 1.2 * liveWeight;
      const leader = d > 0 ? p1.name.split(' ')[0] : p2.name.split(' ')[0];
      if (Math.abs(d) >= 2) {
        factors.push(`${leader} доминирует (${m.score.p1}:${m.score.p2})`);
      } else {
        factors.push(`${leader} лидирует (${m.score.p1}:${m.score.p2})`);
      }
    }
  }
  
  const rawConf = 50 + Math.abs(score) * 4.5;
  const conf = Math.max(48, Math.min(96, Math.round(rawConf)));
  
  let betType: 'strong' | 'medium' | 'risky' | 'skip' = 'skip';
  if (conf >= 78) betType = 'strong';
  else if (conf >= 67) betType = 'medium';
  else if (conf >= 56) betType = 'risky';
  
  if (factors.length === 0) {
    factors.push('Игроки примерно равны по силам');
  }
  
  return {
    winner: (score >= 0 ? 'p1' : 'p2') as 'p1' | 'p2',
    confidence: conf,
    factors: factors.slice(0, 4),
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



const API_BACKEND = 'https://functions.poehali.dev/6a9f6c04-269b-4b4b-9151-6645433dba77';

function parseApiSportsEvent(ev: Record<string, unknown>): Match | null {
  try {
    const teams = (ev.teams as Record<string, Record<string, unknown>>) || {};
    const home = teams.home || {};
    const away = teams.away || {};
    const p1n = String(home.name || '');
    const p2n = String(away.name || '');
    if (!p1n || !p2n) return null;
    
    const status_str = String(ev.status || 'scheduled');
    let status: 'live' | 'upcoming' | 'finished' = 'upcoming';
    if (status_str === 'LIVE' || status_str === 'inprogress') status = 'live';
    else if (status_str === 'FT' || status_str === 'finished') status = 'finished';
    
    const r1 = rating(p1n), r2 = rating(p2n);
    
    const league = (ev.league as Record<string, unknown>) || {};
    const leagueName = String(league.name || 'Table Tennis');
    
    const match: Match = {
      id: String(ev.id),
      player1: { id: String(home.id || p1n), name: p1n, rating: r1, winRate: winrate(r1), recentForm: form(p1n), country: 'RU' },
      player2: { id: String(away.id || p2n), name: p2n, rating: r2, winRate: winrate(r2), recentForm: form(p2n), country: 'RU' },
      startTime: String(ev.date || new Date().toISOString()),
      status,
      odds: odds(r1, r2),
      league: leagueName
    };
    
    const scores = (ev.scores as Record<string, unknown>) || {};
    const homeScore = Number(scores.home) || 0;
    const awayScore = Number(scores.away) || 0;
    
    if (status !== 'upcoming' && (homeScore > 0 || awayScore > 0)) {
      match.score = { p1: homeScore, p2: awayScore };
    }
    
    match.prediction = predict(match);
    return match;
  } catch {
    return null;
  }
}

function loadManualMatches(): Match[] {
  try {
    const stored = localStorage.getItem('manual_matches');
    if (!stored) return [];
    
    const manual = JSON.parse(stored) as Array<{
      id: string;
      player1: string;
      player2: string;
      league: string;
      status: 'live' | 'upcoming';
      score?: { p1: number; p2: number };
    }>;
    
    return manual.map(m => {
      const r1 = rating(m.player1);
      const r2 = rating(m.player2);
      
      const match: Match = {
        id: m.id,
        player1: {
          id: m.player1,
          name: m.player1,
          rating: r1,
          winRate: winrate(r1),
          recentForm: form(m.player1),
          country: 'RU'
        },
        player2: {
          id: m.player2,
          name: m.player2,
          rating: r2,
          winRate: winrate(r2),
          recentForm: form(m.player2),
          country: 'RU'
        },
        startTime: new Date().toISOString(),
        status: m.status,
        odds: odds(r1, r2),
        league: m.league,
        score: m.score
      };
      
      match.prediction = predict(match);
      return match;
    });
  } catch {
    return [];
  }
}

export async function fetchMatches(): Promise<ApiResponse> {
  const allMatches: Match[] = [];
  let source = 'manual';
  
  const manualMatches = loadManualMatches();
  if (manualMatches.length > 0) {
    allMatches.push(...manualMatches);
    source = 'manual';
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
    source,
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