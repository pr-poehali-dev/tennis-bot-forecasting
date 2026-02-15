import { useMemo } from 'react';
import { Card } from '@/components/ui/card';
import Icon from '@/components/ui/icon';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
  PieChart,
  Pie,
} from 'recharts';
import type { Match } from '@/data/matches';

interface AnalyticsPanelProps {
  matches: Match[];
}

const tooltipStyle = {
  contentStyle: {
    backgroundColor: 'hsl(220 18% 10%)',
    border: '1px solid hsl(220 14% 16%)',
    borderRadius: '8px',
    color: 'hsl(210 20% 92%)',
    fontSize: '12px',
  },
  itemStyle: { color: 'hsl(210 20% 92%)' },
  labelStyle: { color: 'hsl(215 15% 55%)' },
};

export default function AnalyticsPanel({ matches }: AnalyticsPanelProps) {
  const confidenceData = useMemo(() => {
    const ranges = [
      { range: '48-55', min: 48, max: 55, count: 0 },
      { range: '55-65', min: 55, max: 65, count: 0 },
      { range: '65-75', min: 65, max: 75, count: 0 },
      { range: '75-85', min: 75, max: 85, count: 0 },
      { range: '85+', min: 85, max: 100, count: 0 },
    ];
    for (const m of matches) {
      if (!m.prediction) continue;
      const c = m.prediction.confidence;
      for (const r of ranges) {
        if (c >= r.min && c <= r.max) { r.count++; break; }
      }
    }
    return ranges.map(r => ({ range: r.range, count: r.count }));
  }, [matches]);

  const leagueData = useMemo(() => {
    const leagues: Record<string, { total: number; correct: number }> = {};
    for (const m of matches) {
      if (m.status !== 'finished' || !m.prediction || !m.score) continue;
      const l = m.league.replace('Лига Про ', '');
      if (!leagues[l]) leagues[l] = { total: 0, correct: 0 };
      leagues[l].total++;
      const predictedP1 = m.prediction.winner === 'p1';
      const p1Won = m.score.p1 > m.score.p2;
      if (predictedP1 === p1Won) leagues[l].correct++;
    }
    return Object.entries(leagues).map(([league, d]) => ({
      league,
      winrate: d.total > 0 ? Math.round((d.correct / d.total) * 100) : 0,
      count: d.total,
    }));
  }, [matches]);

  const statusData = useMemo(() => {
    const live = matches.filter(m => m.status === 'live').length;
    const upcoming = matches.filter(m => m.status === 'upcoming').length;
    const finished = matches.filter(m => m.status === 'finished').length;
    return [
      { name: 'Live', value: live, fill: '#ef4444' },
      { name: 'Ожидаемые', value: upcoming, fill: '#f59e0b' },
      { name: 'Завершены', value: finished, fill: '#22c55e' },
    ].filter(d => d.value > 0);
  }, [matches]);

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-2">
        <Icon name="BarChart3" size={20} className="text-primary" />
        <h2 className="text-lg font-bold text-foreground">Аналитика</h2>
        <span className="text-xs text-muted-foreground ml-auto">{matches.length} матчей загружено</span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card className="p-5 border-border/50">
          <h3 className="text-sm font-semibold text-foreground mb-4">
            Распределение уверенности
          </h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={confidenceData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis
                dataKey="range"
                tick={{ fill: '#64748b', fontSize: 12 }}
                axisLine={{ stroke: '#1e293b' }}
                tickLine={false}
              />
              <YAxis
                tick={{ fill: '#64748b', fontSize: 12 }}
                axisLine={{ stroke: '#1e293b' }}
                tickLine={false}
              />
              <Tooltip
                formatter={(value: number) => [value, 'Прогнозов']}
                {...tooltipStyle}
              />
              <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                {confidenceData.map((_, index) => (
                  <Cell
                    key={index}
                    fill={index >= 3 ? '#22c55e' : index >= 1 ? '#3b82f6' : '#64748b'}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </Card>

        <Card className="p-5 border-border/50">
          <h3 className="text-sm font-semibold text-foreground mb-4">
            Статус матчей
          </h3>
          <div className="flex items-center gap-6">
            <ResponsiveContainer width="50%" height={180}>
              <PieChart>
                <Pie
                  data={statusData}
                  cx="50%"
                  cy="50%"
                  innerRadius={45}
                  outerRadius={70}
                  paddingAngle={3}
                  dataKey="value"
                />
                <Tooltip {...tooltipStyle} />
              </PieChart>
            </ResponsiveContainer>
            <div className="space-y-3">
              {statusData.map(d => (
                <div key={d.name} className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full" style={{ backgroundColor: d.fill }} />
                  <span className="text-sm text-muted-foreground">{d.name}</span>
                  <span className="text-sm font-bold text-foreground">{d.value}</span>
                </div>
              ))}
            </div>
          </div>
        </Card>

        {leagueData.length > 0 && (
          <Card className="p-5 border-border/50 lg:col-span-2">
            <h3 className="text-sm font-semibold text-foreground mb-4">
              Винрейт по лигам
            </h3>
            <ResponsiveContainer width="100%" height={Math.max(120, leagueData.length * 50)}>
              <BarChart data={leagueData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" horizontal={false} />
                <XAxis
                  type="number"
                  domain={[0, 100]}
                  tick={{ fill: '#64748b', fontSize: 12 }}
                  axisLine={{ stroke: '#1e293b' }}
                  tickLine={false}
                  tickFormatter={(v) => `${v}%`}
                />
                <YAxis
                  type="category"
                  dataKey="league"
                  tick={{ fill: '#64748b', fontSize: 12 }}
                  axisLine={{ stroke: '#1e293b' }}
                  tickLine={false}
                  width={120}
                />
                <Tooltip
                  formatter={(value: number) => [`${value}%`, 'Винрейт']}
                  {...tooltipStyle}
                />
                <Bar dataKey="winrate" radius={[0, 4, 4, 0]} fill="#22c55e" barSize={28}>
                  {leagueData.map((entry, index) => (
                    <Cell
                      key={index}
                      fill={entry.winrate > 70 ? '#22c55e' : entry.winrate > 50 ? '#3b82f6' : '#f59e0b'}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </Card>
        )}
      </div>
    </div>
  );
}
