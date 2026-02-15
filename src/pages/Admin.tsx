import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import Icon from '@/components/ui/icon';
import { Badge } from '@/components/ui/badge';

interface ManualMatch {
  id: string;
  player1: string;
  player2: string;
  league: string;
  status: 'live' | 'upcoming';
  score?: { p1: number; p2: number };
}

export default function Admin() {
  const [matches, setMatches] = useState<ManualMatch[]>([]);
  const [p1, setP1] = useState('');
  const [p2, setP2] = useState('');
  const [league, setLeague] = useState('Лига Про Россия');
  const [status, setStatus] = useState<'live' | 'upcoming'>('upcoming');
  const [score1, setScore1] = useState('');
  const [score2, setScore2] = useState('');

  const addMatch = () => {
    if (!p1 || !p2) return;

    const newMatch: ManualMatch = {
      id: Date.now().toString(),
      player1: p1,
      player2: p2,
      league,
      status,
      score: status === 'live' && score1 && score2 ? {
        p1: parseInt(score1) || 0,
        p2: parseInt(score2) || 0
      } : undefined
    };

    setMatches([...matches, newMatch]);
    localStorage.setItem('manual_matches', JSON.stringify([...matches, newMatch]));
    
    setP1('');
    setP2('');
    setScore1('');
    setScore2('');
  };

  const deleteMatch = (id: string) => {
    const updated = matches.filter(m => m.id !== id);
    setMatches(updated);
    localStorage.setItem('manual_matches', JSON.stringify(updated));
  };

  const clearAll = () => {
    setMatches([]);
    localStorage.removeItem('manual_matches');
  };

  return (
    <div className="min-h-screen bg-background p-4 lg:p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center gap-3">
          <Icon name="Settings" size={28} className="text-primary" />
          <div>
            <h1 className="text-2xl font-bold text-foreground">Админка</h1>
            <p className="text-sm text-muted-foreground">Добавление матчей вручную</p>
          </div>
        </div>

        <Card className="p-6 border-border/50">
          <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
            <Icon name="Plus" size={20} className="text-primary" />
            Добавить матч
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="text-sm text-muted-foreground mb-1 block">Игрок 1</label>
              <Input 
                value={p1} 
                onChange={(e) => setP1(e.target.value)}
                placeholder="Ivanov A."
              />
            </div>

            <div>
              <label className="text-sm text-muted-foreground mb-1 block">Игрок 2</label>
              <Input 
                value={p2} 
                onChange={(e) => setP2(e.target.value)}
                placeholder="Petrov D."
              />
            </div>

            <div>
              <label className="text-sm text-muted-foreground mb-1 block">Лига</label>
              <select 
                value={league}
                onChange={(e) => setLeague(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground"
              >
                <option>Лига Про Россия</option>
                <option>Мастерс Минск</option>
                <option>Сетка Кап</option>
                <option>TT Cup</option>
                <option>Elite Series</option>
              </select>
            </div>

            <div>
              <label className="text-sm text-muted-foreground mb-1 block">Статус</label>
              <select 
                value={status}
                onChange={(e) => setStatus(e.target.value as 'live' | 'upcoming')}
                className="w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground"
              >
                <option value="upcoming">Предстоящий</option>
                <option value="live">Live</option>
              </select>
            </div>

            {status === 'live' && (
              <>
                <div>
                  <label className="text-sm text-muted-foreground mb-1 block">Счёт игрока 1</label>
                  <Input 
                    type="number"
                    value={score1} 
                    onChange={(e) => setScore1(e.target.value)}
                    placeholder="0"
                  />
                </div>

                <div>
                  <label className="text-sm text-muted-foreground mb-1 block">Счёт игрока 2</label>
                  <Input 
                    type="number"
                    value={score2} 
                    onChange={(e) => setScore2(e.target.value)}
                    placeholder="0"
                  />
                </div>
              </>
            )}
          </div>

          <Button onClick={addMatch} className="w-full">
            <Icon name="Plus" size={18} />
            Добавить матч
          </Button>
        </Card>

        <Card className="p-6 border-border/50">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold flex items-center gap-2">
              <Icon name="List" size={20} className="text-primary" />
              Добавленные матчи ({matches.length})
            </h2>
            {matches.length > 0 && (
              <Button variant="ghost" size="sm" onClick={clearAll}>
                <Icon name="Trash2" size={16} />
                Очистить всё
              </Button>
            )}
          </div>

          {matches.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Icon name="Inbox" size={40} className="mx-auto mb-2 opacity-50" />
              <p className="text-sm">Нет добавленных матчей</p>
            </div>
          ) : (
            <div className="space-y-2">
              {matches.map((m) => (
                <div key={m.id} className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      {m.status === 'live' && (
                        <Badge className="bg-red-500/15 text-red-400 border-red-500/30 text-xs">LIVE</Badge>
                      )}
                      <span className="text-sm font-medium">{m.player1} vs {m.player2}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground">{m.league}</span>
                      {m.score && (
                        <span className="text-xs font-mono text-primary">{m.score.p1}:{m.score.p2}</span>
                      )}
                    </div>
                  </div>
                  <Button variant="ghost" size="sm" onClick={() => deleteMatch(m.id)}>
                    <Icon name="X" size={16} />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </Card>

        <Card className="p-4 border-amber-500/30 bg-amber-500/5">
          <div className="flex items-start gap-2">
            <Icon name="Info" size={18} className="text-amber-500 mt-0.5" />
            <div className="text-sm text-muted-foreground">
              <p className="font-medium text-amber-500 mb-1">Как использовать:</p>
              <ol className="list-decimal list-inside space-y-1 text-xs">
                <li>Открой сайт с матчами (например, flashscore.com)</li>
                <li>Найди матчи Liga Pro / Setka Cup</li>
                <li>Скопируй имена игроков и добавь сюда</li>
                <li>Матчи автоматически появятся на главной странице</li>
              </ol>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
