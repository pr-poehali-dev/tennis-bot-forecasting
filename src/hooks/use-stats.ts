import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { Match } from '@/data/matches';

const STATS_URL = 'https://functions.poehali.dev/f77f3d82-2bdf-4aa6-8b2e-d8d33e745a37';
const SAVE_URL = 'https://functions.poehali.dev/f86ca3f7-b78d-4322-b841-1a95fc652f05';

export interface DbStats {
  period: string;
  total: number;
  correct: number;
  incorrect: number;
  pending: number;
  winRate: number;
  roi: number;
  avgOdds: number;
  streak: number;
  strongCount: number;
  mediumCount: number;
  riskyCount: number;
  byLeague: { league: string; winRate: number; total: number; correct: number }[];
  daily: { date: string; winRate: number; total: number; correct: number }[];
  updatedAt: string;
}

export function useStats(period: string = 'all') {
  return useQuery<DbStats>({
    queryKey: ['stats', period],
    queryFn: async () => {
      const res = await fetch(`${STATS_URL}?period=${period}`);
      if (!res.ok) throw new Error('Failed to fetch stats');
      return res.json();
    },
    refetchInterval: 60000,
    staleTime: 30000,
  });
}

export function useSavePredictions() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (matches: Match[]) => {
      const res = await fetch(SAVE_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ matches }),
      });
      if (!res.ok) throw new Error('Failed to save predictions');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['stats'] });
    },
  });
}