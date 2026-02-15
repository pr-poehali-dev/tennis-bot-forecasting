import { useState, useEffect } from 'react';
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
  const [importCount, setImportCount] = useState(0);
  const [hasImportData, setHasImportData] = useState(false);
  
  useEffect(() => {
    const stored = localStorage.getItem('manual_matches');
    if (stored) {
      try {
        setMatches(JSON.parse(stored));
      } catch (e) {
        console.error('Failed to load matches', e);
      }
    }
    
    checkImportData();
  }, []);
  
  const checkImportData = () => {
    const imported = localStorage.getItem('liga_stavok_import');
    if (imported) {
      try {
        const data = JSON.parse(imported);
        setImportCount(data.length);
        setHasImportData(true);
      } catch {
        setHasImportData(false);
      }
    }
  };
  
  const importFromLigaStavok = () => {
    const imported = localStorage.getItem('liga_stavok_import');
    if (!imported) return;
    
    try {
      const data = JSON.parse(imported) as Array<{ player1: string; player2: string }>;
      const newMatches = data.map(d => ({
        id: Date.now().toString() + Math.random().toString(36),
        player1: d.player1,
        player2: d.player2,
        league: 'Лига Про Россия',
        status: 'upcoming' as const
      }));
      
      const updated = [...matches, ...newMatches];
      setMatches(updated);
      localStorage.setItem('manual_matches', JSON.stringify(updated));
      localStorage.removeItem('liga_stavok_import');
      setHasImportData(false);
      setImportCount(0);
      
      alert(`✅ Импортировано ${newMatches.length} матчей!`);
    } catch (e) {
      alert('Ошибка импорта: ' + e);
    }
  };
  
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
  
  const toggleLive = (id: string) => {
    const updated = matches.map(m => {
      if (m.id === id) {
        return { ...m, status: m.status === 'live' ? 'upcoming' : 'live' as const };
      }
      return m;
    });
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
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Icon name="Settings" size={28} className="text-primary" />
            <div>
              <h1 className="text-2xl font-bold text-foreground">Админка</h1>
              <p className="text-sm text-muted-foreground">Добавление матчей вручную</p>
            </div>
          </div>
          <a href="/">
            <Button variant="outline">
              <Icon name="ArrowLeft" size={16} />
              Назад
            </Button>
          </a>
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
                  <div className="flex items-center gap-1">
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => toggleLive(m.id)}
                      title={m.status === 'live' ? 'Остановить live' : 'Запустить live'}
                    >
                      <Icon name={m.status === 'live' ? 'Pause' : 'Play'} size={16} className={m.status === 'live' ? 'text-red-400' : 'text-green-400'} />
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => deleteMatch(m.id)}>
                      <Icon name="X" size={16} />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>

        <Card className="p-6 border-border/50">
          <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
            <Icon name="Download" size={20} className="text-primary" />
            Импорт из Лига Ставок
          </h2>

          <div className="bg-primary/5 border border-primary/20 rounded-lg p-4 mb-4">
            <h3 className="font-semibold text-sm mb-2">🔖 Букмарклет для быстрого импорта</h3>
            <p className="text-xs text-muted-foreground mb-3">
              Перетащи эту кнопку на панель закладок браузера, затем запусти её на странице Liga Stavok
            </p>
            <div className="bg-background rounded-lg p-3 border border-border">
              <a
                href={`javascript:(function(){const m=[];const p=/([А-Яа-я\\s\\.\\-]+[А-Яа-я])\\s*[-–—vs\\.]+\\s*([А-Яа-я\\s\\.\\-]+[А-Яа-я])/gi;document.querySelectorAll('*').forEach(e=>{const t=(e.textContent||'').trim();if(t.length>10&&t.length<200){const r=t.match(p);if(r){const s=t.split(/[-–—vs\\.]/);if(s.length===2){const p1=s[0].trim(),p2=s[1].trim();if(p1.length>3&&p2.length>3&&p1.length<50&&p2.length<50){m.push({player1:p1,player2:p2})}}}}});const u=[];const n=new Set();m.forEach(x=>{const k=x.player1+'|'+x.player2;if(!n.has(k)){n.add(k);u.push(x)}});if(u.length>0){localStorage.setItem('liga_stavok_import',JSON.stringify(u));const d=document.createElement('div');d.style.cssText='position:fixed;top:20px;right:20px;background:#22c55e;color:white;padding:20px;border-radius:12px;box-shadow:0 8px 24px rgba(0,0,0,0.3);z-index:999999;font-family:system-ui;min-width:300px';d.innerHTML='<div style="font-size:18px;font-weight:bold;margin-bottom:8px">✅ Найдено '+u.length+' матчей!</div><div style="font-size:14px;opacity:0.9;margin-bottom:12px">Переходи в админку для импорта</div><button onclick="window.open(\\'/admin\\',\\'_blank\\');this.parentElement.remove()" style="background:white;color:#22c55e;border:none;padding:8px 16px;border-radius:6px;font-weight:600;cursor:pointer">Открыть админку</button>';document.body.appendChild(d);setTimeout(()=>d.remove(),10000)}else{alert('❌ Матчи не найдены.\\nПроверь, что ты на странице настольного тенниса')}})();`}
                className="text-xs font-mono bg-primary text-primary-foreground px-3 py-2 rounded inline-flex items-center gap-2 hover:opacity-80 transition-opacity cursor-move"
                onClick={(e) => { e.preventDefault(); alert('💡 Инструкция:\n\n1. Зажми эту кнопку левой кнопкой мыши\n2. Перетащи её на панель закладок браузера (верхняя часть окна)\n3. Открой ligastavok.ru → Настольный теннис\n4. Нажми на эту закладку\n5. Вернись сюда и нажми "Импортировать"'); }}
              >
                📊 Импорт из Liga Stavok
              </a>
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              После запуска букмарклета матчи автоматически появятся ниже
            </p>
          </div>

          <Button 
            onClick={importFromLigaStavok}
            variant="outline"
            className="w-full"
            disabled={!hasImportData}
          >
            <Icon name="Download" size={16} />
            Импортировать найденные матчи ({importCount})
          </Button>
        </Card>

        <Card className="p-4 border-amber-500/30 bg-amber-500/5">
          <div className="flex items-start gap-2">
            <Icon name="Info" size={18} className="text-amber-500 mt-0.5" />
            <div className="text-sm text-muted-foreground">
              <p className="font-medium text-amber-500 mb-1">Инструкция:</p>
              <ol className="list-decimal list-inside space-y-1 text-xs">
                <li>Открой ligastavok.ru → Настольный теннис → Лига Про</li>
                <li>Запусти букмарклет (кнопка в закладках)</li>
                <li>Вернись сюда и нажми "Импортировать найденные матчи"</li>
                <li>Матчи появятся на главной странице</li>
                <li className="text-green-400 font-medium">Live счёт обновляется автоматически каждые 10 сек</li>
              </ol>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}