import { useQuery } from '@tanstack/react-query';
import { fetchMatches } from '@/data/matches';

export function useMatches() {
  return useQuery({
    queryKey: ['matches'],
    queryFn: fetchMatches,
    refetchInterval: 30000,
    staleTime: 15000,
  });
}
