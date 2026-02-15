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
import { getMatches } from '@/data/matches';

interface ResultRow {
  id: string;
  time: string;
  matchName: string;
  prediction: string;
  odds: number;
  isCorrect: boolean;
}

function buildResults(): ResultRow[] {
  const matches = getMatches().filter((m) => m.status === 'finished' && m.prediction);

  const results: ResultRow[] = matches.map((m) => {
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

  // Add some extra historical results for variety
  const extraResults: ResultRow[] = [
    { id: 'h1', time: '09:00', matchName: 'Макаров Б. vs Волков Е.', prediction: 'Макаров Б.', odds: 1.55, isCorrect: true },
    { id: 'h2', time: '09:15', matchName: 'Федоров Г. vs Попов Р.', prediction: 'Федоров Г.', odds: 1.42, isCorrect: true },
    { id: 'h3', time: '09:30', matchName: 'Лебедев П. vs Орлов Т.', prediction: 'Лебедев П.', odds: 1.38, isCorrect: true },
    { id: 'h4', time: '09:45', matchName: 'Соколов Н. vs Сидоров В.', prediction: 'Соколов Н.', odds: 1.68, isCorrect: false },
    { id: 'h5', time: '08:30', matchName: 'Петров И. vs Васильев К.', prediction: 'Петров И.', odds: 1.30, isCorrect: true },
    { id: 'h6', time: '08:45', matchName: 'Козлов А. vs Егоров С.', prediction: 'Козлов А.', odds: 1.72, isCorrect: true },
    { id: 'h7', time: '08:00', matchName: 'Новиков М. vs Морозов Д.', prediction: 'Новиков М.', odds: 1.85, isCorrect: false },
    { id: 'h8', time: '08:15', matchName: 'Кузнецов А. vs Орлов Т.', prediction: 'Кузнецов А.', odds: 1.48, isCorrect: true },
    { id: 'h9', time: '07:30', matchName: 'Федоров Г. vs Козлов А.', prediction: 'Федоров Г.', odds: 1.60, isCorrect: true },
    { id: 'h10', time: '07:45', matchName: 'Лебедев П. vs Попов Р.', prediction: 'Лебедев П.', odds: 1.52, isCorrect: true },
    { id: 'h11', time: '07:00', matchName: 'Макаров Б. vs Сидоров В.', prediction: 'Макаров Б.', odds: 1.65, isCorrect: true },
    { id: 'h12', time: '07:15', matchName: 'Петров И. vs Морозов Д.', prediction: 'Петров И.', odds: 1.45, isCorrect: true },
    { id: 'h13', time: '06:30', matchName: 'Волков Е. vs Васильев К.', prediction: 'Волков Е.', odds: 1.78, isCorrect: false },
    { id: 'h14', time: '06:45', matchName: 'Соколов Н. vs Егоров С.', prediction: 'Соколов Н.', odds: 1.62, isCorrect: true },
    { id: 'h15', time: '06:00', matchName: 'Новиков М. vs Орлов Т.', prediction: 'Новиков М.', odds: 1.40, isCorrect: true },
  ];

  return [...results, ...extraResults].slice(0, 20);
}

export default function ResultsPanel() {
  const results = buildResults();
  const correctCount = results.filter((r) => r.isCorrect).length;
  const totalOdds = results.reduce((sum, r) => sum + r.odds, 0);
  const avgOdds = totalOdds / results.length;

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-2">
        <Icon name="Trophy" size={20} className="text-primary" />
        <h2 className="text-lg font-bold text-foreground">Результаты прогнозов</h2>
      </div>

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
                {((correctCount / results.length) * 100).toFixed(0)}%
              </TableCell>
            </TableRow>
          </TableFooter>
        </Table>
      </Card>
    </div>
  );
}
