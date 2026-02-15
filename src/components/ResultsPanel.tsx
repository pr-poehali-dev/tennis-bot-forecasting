import { useMemo } from 'react';
import Icon from '@/components/ui/icon';
import { Card } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import type { Match } from '@/data/matches';

interface ResultsPanelProps {
  matches: Match[];
}

interface ResultRow {
  id: string;
  time: string;
  matchName: string;
  prediction: string;
  odds: number;
  isCorrect: boolean;
}

export default function ResultsPanel({ matches }: ResultsPanelProps) {
  const results = useMemo<ResultRow[]>(() => {
    const finished = matches.filter((m) => m.status === 'finished' && m.prediction && m.score);
    return finished.map((m) => {
      const predictedP1 = m.prediction!.winner === 'p1';
      const actualP1Won = m.score!.p1 > m.score!.p2;
      const isCorrect = predictedP1 === actualP1Won;
      const predictedName = predictedP1 ? m.player1.name : m.player2.name;
      const odds = predictedP1 ? m.odds.p1Win : m.odds.p2Win;

      return {
        id: m.id,
        time: new Date(m.startTime).toLocaleTimeString('ru-RU', {
          hour: '2-digit',
          minute: '2-digit',
        }),
        matchName: `${m.player1.name} vs ${m.player2.name}`,
        prediction: predictedName,
        odds,
        isCorrect,
      };
    });
  }, [matches]);

  const correctCount = results.filter((r) => r.isCorrect).length;
  const totalOdds = results.reduce((sum, r) => sum + r.odds, 0);
  const avgOdds = results.length > 0 ? totalOdds / results.length : 0;

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-2">
        <Icon name="Trophy" size={20} className="text-primary" />
        <h2 className="text-lg font-bold text-foreground">Результаты прогнозов</h2>
      </div>

      {results.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <Icon name="Clock" size={40} className="mx-auto mb-3 opacity-50" />
          <p className="text-sm">Пока нет завершённых матчей с прогнозами</p>
        </div>
      ) : (
        <Card className="border-border/50 overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="border-border/50 hover:bg-transparent">
                <TableHead className="text-xs">Время</TableHead>
                <TableHead className="text-xs">Матч</TableHead>
                <TableHead className="text-xs">Прогноз</TableHead>
                <TableHead className="text-xs text-center">Коэфф.</TableHead>
                <TableHead className="text-xs text-center">Результат</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {results.map((row) => (
                <TableRow key={row.id} className="border-border/30 hover:bg-secondary/30">
                  <TableCell className="text-xs text-muted-foreground font-mono">
                    {row.time}
                  </TableCell>
                  <TableCell className="text-sm font-medium">{row.matchName}</TableCell>
                  <TableCell className="text-sm text-primary font-medium">
                    {row.prediction}
                  </TableCell>
                  <TableCell className="text-sm text-center font-mono">
                    {row.odds.toFixed(2)}
                  </TableCell>
                  <TableCell className="text-center">
                    {row.isCorrect ? (
                      <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-primary/15 text-primary text-sm">
                        <Icon name="Check" size={14} />
                      </span>
                    ) : (
                      <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-red-500/15 text-red-400 text-sm">
                        <Icon name="X" size={14} />
                      </span>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
            <TableFooter className="bg-secondary/30 border-border/50">
              <TableRow className="hover:bg-transparent">
                <TableCell colSpan={2} className="text-sm font-semibold">
                  Итого: {results.length} прогнозов
                </TableCell>
                <TableCell className="text-sm font-semibold text-primary">
                  {correctCount} верных
                </TableCell>
                <TableCell className="text-sm text-center font-mono">
                  ~{avgOdds.toFixed(2)}
                </TableCell>
                <TableCell className="text-sm text-center font-bold text-primary">
                  {results.length > 0 ? ((correctCount / results.length) * 100).toFixed(0) : 0}%
                </TableCell>
              </TableRow>
            </TableFooter>
          </Table>
        </Card>
      )}
    </div>
  );
}
