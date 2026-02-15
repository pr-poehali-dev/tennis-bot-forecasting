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
}

const API_URL = 'https://functions.poehali.dev/6a9f6c04-269b-4b4b-9151-6645433dba77';

export interface ApiResponse {
  matches: Match[];
  updatedAt: string;
  source: string;
  count: number;
}

export async function fetchMatches(): Promise<ApiResponse> {
  const res = await fetch(API_URL);
  if (!res.ok) throw new Error('Failed to fetch matches');
  return res.json();
}

export function filterMatches(matches: Match[], filters: MatchFilters): Match[] {
  return matches.filter((m) => {
    if (filters.status && filters.status !== 'all' && m.status !== filters.status) return false;
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
    return true;
  });
}

export function calcStats(matches: Match[]): PredictionStats {
  const finished = matches.filter((m) => m.status === 'finished' && m.prediction);
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
