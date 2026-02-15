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

const players: Player[] = [
  { id: 'p1', name: 'Кузнецов А.', rating: 1847, winRate: 68.3, recentForm: ['W', 'W', 'L', 'W', 'W'], country: 'RU' },
  { id: 'p2', name: 'Морозов Д.', rating: 1792, winRate: 62.1, recentForm: ['L', 'W', 'W', 'L', 'W'], country: 'RU' },
  { id: 'p3', name: 'Петров И.', rating: 1923, winRate: 74.5, recentForm: ['W', 'W', 'W', 'W', 'L'], country: 'RU' },
  { id: 'p4', name: 'Сидоров В.', rating: 1756, winRate: 58.9, recentForm: ['L', 'L', 'W', 'W', 'L'], country: 'RU' },
  { id: 'p5', name: 'Козлов А.', rating: 1881, winRate: 71.2, recentForm: ['W', 'W', 'W', 'L', 'W'], country: 'RU' },
  { id: 'p6', name: 'Новиков М.', rating: 1834, winRate: 65.7, recentForm: ['W', 'L', 'W', 'W', 'W'], country: 'RU' },
  { id: 'p7', name: 'Волков Е.', rating: 1769, winRate: 60.4, recentForm: ['L', 'W', 'L', 'W', 'W'], country: 'RU' },
  { id: 'p8', name: 'Лебедев П.', rating: 1905, winRate: 72.8, recentForm: ['W', 'W', 'W', 'W', 'W'], country: 'RU' },
  { id: 'p9', name: 'Соколов Н.', rating: 1812, winRate: 63.6, recentForm: ['W', 'L', 'L', 'W', 'W'], country: 'RU' },
  { id: 'p10', name: 'Васильев К.', rating: 1743, winRate: 57.2, recentForm: ['L', 'W', 'L', 'L', 'W'], country: 'RU' },
  { id: 'p11', name: 'Попов Р.', rating: 1868, winRate: 69.1, recentForm: ['W', 'W', 'L', 'W', 'L'], country: 'RU' },
  { id: 'p12', name: 'Егоров С.', rating: 1795, winRate: 61.8, recentForm: ['L', 'W', 'W', 'W', 'L'], country: 'RU' },
  { id: 'p13', name: 'Федоров Г.', rating: 1938, winRate: 76.3, recentForm: ['W', 'W', 'W', 'W', 'W'], country: 'RU' },
  { id: 'p14', name: 'Орлов Т.', rating: 1721, winRate: 54.6, recentForm: ['L', 'L', 'W', 'L', 'W'], country: 'RU' },
  { id: 'p15', name: 'Макаров Б.', rating: 1856, winRate: 67.4, recentForm: ['W', 'L', 'W', 'W', 'L'], country: 'RU' },
];

const matches: Match[] = [
  {
    id: 'm1',
    player1: players[0],
    player2: players[1],
    startTime: '2026-02-15T10:00:00',
    status: 'finished',
    score: { p1: 3, p2: 1 },
    sets: [
      { p1: 11, p2: 8 },
      { p1: 9, p2: 11 },
      { p1: 11, p2: 6 },
      { p1: 11, p2: 9 },
    ],
    odds: { p1Win: 1.65, p2Win: 2.20 },
    league: 'Лига Про Москва',
    prediction: {
      winner: 'p1',
      confidence: 78,
      factors: ['Высокий рейтинг', 'Серия побед', 'Преимущество H2H'],
    },
  },
  {
    id: 'm2',
    player1: players[2],
    player2: players[3],
    startTime: '2026-02-15T10:30:00',
    status: 'finished',
    score: { p1: 3, p2: 0 },
    sets: [
      { p1: 11, p2: 5 },
      { p1: 11, p2: 7 },
      { p1: 11, p2: 4 },
    ],
    odds: { p1Win: 1.35, p2Win: 3.10 },
    league: 'Лига Про Москва',
    prediction: {
      winner: 'p1',
      confidence: 89,
      factors: ['Доминирующий рейтинг', 'Отличная форма', 'Слабая форма оппонента'],
    },
  },
  {
    id: 'm3',
    player1: players[4],
    player2: players[5],
    startTime: '2026-02-15T11:00:00',
    status: 'finished',
    score: { p1: 2, p2: 3 },
    sets: [
      { p1: 11, p2: 9 },
      { p1: 7, p2: 11 },
      { p1: 11, p2: 8 },
      { p1: 9, p2: 11 },
      { p1: 8, p2: 11 },
    ],
    odds: { p1Win: 1.72, p2Win: 2.05 },
    league: 'Лига Про Сетка Кап',
    prediction: {
      winner: 'p1',
      confidence: 62,
      factors: ['Небольшое преимущество в рейтинге', 'Лучший винрейт'],
    },
  },
  {
    id: 'm4',
    player1: players[6],
    player2: players[7],
    startTime: '2026-02-15T11:30:00',
    status: 'finished',
    score: { p1: 0, p2: 3 },
    sets: [
      { p1: 6, p2: 11 },
      { p1: 8, p2: 11 },
      { p1: 5, p2: 11 },
    ],
    odds: { p1Win: 2.85, p2Win: 1.40 },
    league: 'Лига Про Москва',
    prediction: {
      winner: 'p2',
      confidence: 84,
      factors: ['Значительное преимущество в рейтинге', 'Серия из 5 побед', 'Высокий винрейт'],
    },
  },
  {
    id: 'm5',
    player1: players[8],
    player2: players[9],
    startTime: '2026-02-15T12:00:00',
    status: 'finished',
    score: { p1: 3, p2: 2 },
    sets: [
      { p1: 11, p2: 9 },
      { p1: 8, p2: 11 },
      { p1: 11, p2: 13 },
      { p1: 11, p2: 7 },
      { p1: 6, p2: 11 },
    ],
    odds: { p1Win: 1.55, p2Win: 2.40 },
    league: 'Лига Про Сетка Кап',
    prediction: {
      winner: 'p1',
      confidence: 71,
      factors: ['Преимущество в рейтинге', 'Стабильная форма'],
    },
  },
  {
    id: 'm6',
    player1: players[10],
    player2: players[11],
    startTime: '2026-02-15T14:15:00',
    status: 'live',
    score: { p1: 2, p2: 1 },
    sets: [
      { p1: 11, p2: 7 },
      { p1: 9, p2: 11 },
      { p1: 11, p2: 8 },
    ],
    odds: { p1Win: 1.58, p2Win: 2.30 },
    league: 'Лига Про Москва',
    prediction: {
      winner: 'p1',
      confidence: 74,
      factors: ['Высокий рейтинг', 'Хорошая форма', 'Преимущество H2H'],
    },
  },
  {
    id: 'm7',
    player1: players[12],
    player2: players[0],
    startTime: '2026-02-15T14:30:00',
    status: 'live',
    score: { p1: 1, p2: 1 },
    sets: [
      { p1: 11, p2: 9 },
      { p1: 8, p2: 11 },
    ],
    odds: { p1Win: 1.45, p2Win: 2.65 },
    league: 'Лига Про Сетка Кап',
    prediction: {
      winner: 'p1',
      confidence: 81,
      factors: ['Лучший рейтинг в лиге', 'Безупречная серия', 'Высокий винрейт 76%'],
    },
  },
  {
    id: 'm8',
    player1: players[13],
    player2: players[5],
    startTime: '2026-02-15T14:45:00',
    status: 'live',
    score: { p1: 0, p2: 2 },
    sets: [
      { p1: 7, p2: 11 },
      { p1: 9, p2: 11 },
    ],
    odds: { p1Win: 3.20, p2Win: 1.32 },
    league: 'Лига Про Москва',
    prediction: {
      winner: 'p2',
      confidence: 86,
      factors: ['Значительная разница в рейтинге', 'Плохая форма первого игрока', 'Высокий винрейт второго'],
    },
  },
  {
    id: 'm9',
    player1: players[3],
    player2: players[8],
    startTime: '2026-02-15T15:30:00',
    status: 'upcoming',
    odds: { p1Win: 2.45, p2Win: 1.52 },
    league: 'Лига Про Москва',
    prediction: {
      winner: 'p2',
      confidence: 73,
      factors: ['Преимущество в рейтинге', 'Лучшая текущая форма'],
    },
  },
  {
    id: 'm10',
    player1: players[7],
    player2: players[4],
    startTime: '2026-02-15T15:45:00',
    status: 'upcoming',
    odds: { p1Win: 1.62, p2Win: 2.25 },
    league: 'Лига Про Сетка Кап',
    prediction: {
      winner: 'p1',
      confidence: 77,
      factors: ['Серия из 5 побед', 'Высокий рейтинг', 'Стабильный винрейт'],
    },
  },
  {
    id: 'm11',
    player1: players[1],
    player2: players[14],
    startTime: '2026-02-15T16:00:00',
    status: 'upcoming',
    odds: { p1Win: 2.10, p2Win: 1.70 },
    league: 'Лига Про Москва',
    prediction: {
      winner: 'p2',
      confidence: 66,
      factors: ['Небольшое преимущество в рейтинге', 'Лучший винрейт'],
    },
  },
  {
    id: 'm12',
    player1: players[9],
    player2: players[12],
    startTime: '2026-02-15T16:30:00',
    status: 'upcoming',
    odds: { p1Win: 3.50, p2Win: 1.28 },
    league: 'Лига Про Сетка Кап',
    prediction: {
      winner: 'p2',
      confidence: 91,
      factors: ['Огромная разница в рейтинге', 'Лучшая форма', 'Доминирующий винрейт'],
    },
  },
  {
    id: 'm13',
    player1: players[11],
    player2: players[6],
    startTime: '2026-02-15T17:00:00',
    status: 'upcoming',
    odds: { p1Win: 1.85, p2Win: 1.95 },
    league: 'Лига Про Москва',
    prediction: {
      winner: 'p1',
      confidence: 58,
      factors: ['Незначительное преимущество в рейтинге', 'Равные шансы'],
    },
  },
  {
    id: 'm14',
    player1: players[2],
    player2: players[10],
    startTime: '2026-02-15T17:30:00',
    status: 'upcoming',
    odds: { p1Win: 1.48, p2Win: 2.55 },
    league: 'Лига Про Сетка Кап',
    prediction: {
      winner: 'p1',
      confidence: 82,
      factors: ['Лучший рейтинг', 'Отличная серия', 'Высокий винрейт 74%'],
    },
  },
  {
    id: 'm15',
    player1: players[14],
    player2: players[13],
    startTime: '2026-02-15T18:00:00',
    status: 'upcoming',
    odds: { p1Win: 1.42, p2Win: 2.75 },
    league: 'Лига Про Москва',
    prediction: {
      winner: 'p1',
      confidence: 80,
      factors: ['Преимущество в рейтинге 135 очков', 'Лучший винрейт', 'Хорошая форма'],
    },
  },
];

export function getMatches(): Match[] {
  return matches;
}

export function getPredictionStats(): PredictionStats {
  return {
    totalPredictions: 347,
    correctPredictions: 250,
    winRate: 72.0,
    streak: 8,
    todayPredictions: 15,
    todayCorrect: 11,
    roi: 14.8,
    avgOdds: 1.73,
  };
}

export function getFilteredMatches(filters: MatchFilters): Match[] {
  return matches.filter((match) => {
    if (filters.status && filters.status !== 'all' && match.status !== filters.status) {
      return false;
    }

    if (filters.minOdds) {
      const minOdd = Math.min(match.odds.p1Win, match.odds.p2Win);
      if (minOdd < filters.minOdds) return false;
    }

    if (filters.maxOdds) {
      const maxOdd = Math.max(match.odds.p1Win, match.odds.p2Win);
      if (maxOdd > filters.maxOdds) return false;
    }

    if (filters.minConfidence && match.prediction) {
      if (match.prediction.confidence < filters.minConfidence) return false;
    }

    return true;
  });
}
