import { useEffect, useState } from 'react';

interface LiveMatch {
  id: string;
  player1: string;
  player2: string;
  score: { p1: number; p2: number };
  league: string;
}

export function useLiveMatcher() {
  const [liveMatches, setLiveMatches] = useState<LiveMatch[]>([]);
  const [loading, setLoading] = useState(false);
  
  useEffect(() => {
    const fetchLive = async () => {
      try {
        setLoading(true);
        const response = await fetch('https://www.sofascore.com/api/v1/sport/table-tennis/events/live', {
          headers: {
            'Accept': 'application/json'
          }
        });
        
        if (!response.ok) {
          console.warn('SofaScore blocked:', response.status);
          return;
        }
        
        const data = await response.json();
        const events = data.events || [];
        
        const matches: LiveMatch[] = events.map((ev: Record<string, unknown>) => {
          const homeTeam = ev.homeTeam as Record<string, unknown> | undefined;
          const awayTeam = ev.awayTeam as Record<string, unknown> | undefined;
          const homeScore = ev.homeScore as Record<string, unknown> | undefined;
          const awayScore = ev.awayScore as Record<string, unknown> | undefined;
          const tournament = ev.tournament as Record<string, unknown> | undefined;
          
          const home = (homeTeam?.name as string) || '';
          const away = (awayTeam?.name as string) || '';
          const hScore = (homeScore?.current as number) || 0;
          const aScore = (awayScore?.current as number) || 0;
          const league = (tournament?.name as string) || 'Table Tennis';
          
          return {
            id: String(ev.id),
            player1: home,
            player2: away,
            score: { p1: hScore, p2: aScore },
            league
          };
        });
        
        setLiveMatches(matches);
        console.log(`✓ Found ${matches.length} live matches from SofaScore`);
        if (matches.length > 0) {
          console.log('Sample match:', matches[0]);
        }
      } catch (error) {
        console.warn('Live matcher error:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchLive();
    const interval = setInterval(fetchLive, 15000);
    
    return () => clearInterval(interval);
  }, []);
  
  const findMatch = (player1: string, player2: string): LiveMatch | null => {
    console.log(`🔍 Searching for: ${player1} vs ${player2}`);
    console.log(`Available matches: ${liveMatches.length}`);
    
    const normalize = (name: string) => name.toLowerCase().replace(/[.,\s]/g, '');
    const p1Norm = normalize(player1);
    const p2Norm = normalize(player2);
    
    console.log(`Normalized search: "${p1Norm}" vs "${p2Norm}"`);
    
    for (const match of liveMatches) {
      const m1Norm = normalize(match.player1);
      const m2Norm = normalize(match.player2);
      
      console.log(`Checking: "${m1Norm}" vs "${m2Norm}"`);
      
      const p1Words = p1Norm.split(/\s+/).filter(w => w.length > 0);
      const p2Words = p2Norm.split(/\s+/).filter(w => w.length > 0);
      const m1Words = m1Norm.split(/\s+/).filter(w => w.length > 0);
      const m2Words = m2Norm.split(/\s+/).filter(w => w.length > 0);
      
      const p1Match = p1Words.some(w => w.length > 2 && m1Words.some(mw => mw.includes(w) || w.includes(mw)));
      const p2Match = p2Words.some(w => w.length > 2 && m2Words.some(mw => mw.includes(w) || w.includes(mw)));
      
      if (p1Match && p2Match) {
        console.log(`✅ Found match: ${match.player1} vs ${match.player2} (${match.score.p1}:${match.score.p2})`);
        return match;
      }
      
      const p1Match2 = p1Words.some(w => w.length > 2 && m2Words.some(mw => mw.includes(w) || w.includes(mw)));
      const p2Match2 = p2Words.some(w => w.length > 2 && m1Words.some(mw => mw.includes(w) || w.includes(mw)));
      
      if (p1Match2 && p2Match2) {
        console.log(`✅ Found match (reversed): ${match.player2} vs ${match.player1} (${match.score.p2}:${match.score.p1})`);
        return {
          ...match,
          player1: match.player2,
          player2: match.player1,
          score: { p1: match.score.p2, p2: match.score.p1 }
        };
      }
    }
    
    console.log('❌ No match found');
    return null;
  };
  
  return { liveMatches, loading, findMatch };
}