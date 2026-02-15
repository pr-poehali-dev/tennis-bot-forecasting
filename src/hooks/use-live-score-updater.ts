import { useEffect } from 'react';
import type { Match } from '@/data/matches';

interface LiveScoreUpdate {
  id: string;
  score: { p1: number; p2: number };
}

export function useLiveScoreUpdater(matches: Match[], onUpdate: (updates: LiveScoreUpdate[]) => void) {
  useEffect(() => {
    const liveMatches = matches.filter(m => m.status === 'live');
    
    if (liveMatches.length === 0) return;
    
    const updateScores = async () => {
      try {
        const response = await fetch('https://www.sofascore.com/api/v1/sport/table-tennis/events/live', {
          headers: {
            'Accept': 'application/json'
          }
        });
        
        if (!response.ok) return;
        
        const data = await response.json();
        const events = data.events || [];
        
        const updates: LiveScoreUpdate[] = [];
        
        for (const match of liveMatches) {
          const p1 = normalizeName(match.player1.name);
          const p2 = normalizeName(match.player2.name);
          
          const score = findMatchScore(events, p1, p2);
          if (score) {
            updates.push({
              id: match.id,
              score
            });
          }
        }
        
        if (updates.length > 0) {
          onUpdate(updates);
        }
      } catch (error) {
        console.warn('Live score update failed:', error);
      }
    };
    
    updateScores();
    const interval = setInterval(updateScores, 10000);
    
    return () => clearInterval(interval);
  }, [matches, onUpdate]);
}

function normalizeName(name: string): string {
  return name.toLowerCase().replace(/[.,]/g, '').trim();
}

function findMatchScore(events: unknown[], player1: string, player2: string): { p1: number; p2: number } | null {
  const p1Norm = normalizeName(player1);
  const p2Norm = normalizeName(player2);
  
  for (const event of events) {
    const ev = event as Record<string, unknown>;
    const home = (ev.homeTeam as Record<string, unknown>) || {};
    const away = (ev.awayTeam as Record<string, unknown>) || {};
    
    const homeName = normalizeName(String(home.name || ''));
    const awayName = normalizeName(String(away.name || ''));
    
    const p1Words = p1Norm.split(' ');
    const p2Words = p2Norm.split(' ');
    const homeWords = homeName.split(' ');
    const awayWords = awayName.split(' ');
    
    const p1Match = p1Words.some(w => w.length > 2 && homeWords.includes(w));
    const p2Match = p2Words.some(w => w.length > 2 && awayWords.includes(w));
    
    if (p1Match && p2Match) {
      const homeScore = (ev.homeScore as Record<string, unknown>) || {};
      const awayScore = (ev.awayScore as Record<string, unknown>) || {};
      
      return {
        p1: Number(homeScore.current) || 0,
        p2: Number(awayScore.current) || 0
      };
    }
    
    const p1Match2 = p2Words.some(w => w.length > 2 && homeWords.includes(w));
    const p2Match2 = p1Words.some(w => w.length > 2 && awayWords.includes(w));
    
    if (p1Match2 && p2Match2) {
      const homeScore = (ev.homeScore as Record<string, unknown>) || {};
      const awayScore = (ev.awayScore as Record<string, unknown>) || {};
      
      return {
        p1: Number(awayScore.current) || 0,
        p2: Number(homeScore.current) || 0
      };
    }
  }
  
  return null;
}
