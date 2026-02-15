import { useQuery } from '@tanstack/react-query';
import { fetchMatches } from '@/data/matches';

export function useMatches() {
  return useQuery({
    queryKey: ['matches'],
    queryFn: fetchMatches,
    refetchInterval: 15000,
    staleTime: 10000,
  });
}
