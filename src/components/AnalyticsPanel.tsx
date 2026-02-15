import { Card } from '@/components/ui/card';
import Icon from '@/components/ui/icon';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts';

const winrateData = [
  { day: 'Пн', winrate: 68 },
  { day: 'Вт', winrate: 74 },
  { day: 'Ср', winrate: 71 },
  { day: 'Чт', winrate: 78 },
  { day: 'Пт', winrate: 65 },
  { day: 'Сб', winrate: 80 },
  { day: 'Вс', winrate: 73 },
];

const confidenceData = [
  { range: '50-60', count: 12 },
  { range: '60-70', count: 28 },
  { range: '70-80', count: 45 },
  { range: '80-90', count: 31 },
  { range: '90+', count: 8 },
];

const roiByLeague = [
  { league: 'Москва', roi: 16.2 },
  { league: 'Сетка Кап', roi: 12.5 },
  { league: 'Про Турнир', roi: 8.9 },
  { league: 'Чемпион', roi: 19.4 },
];

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

export default function AnalyticsPanel() {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-2">
        <Icon name="BarChart3" size={20} className="text-primary" />
        <h2 className="text-lg font-bold text-foreground">Аналитика</h2>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Winrate over 7 days */}
        <Card className="p-5 border-border/50">
          <h3 className="text-sm font-semibold text-foreground mb-4">
            Винрейт за 7 дней
          </h3>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={winrateData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis
                dataKey="day"
                tick={{ fill: '#64748b', fontSize: 12 }}
                axisLine={{ stroke: '#1e293b' }}
                tickLine={false}
              />
              <YAxis
                domain={[50, 100]}
                tick={{ fill: '#64748b', fontSize: 12 }}
                axisLine={{ stroke: '#1e293b' }}
                tickLine={false}
                tickFormatter={(v) => `${v}%`}
              />
              <Tooltip
                formatter={(value: number) => [`${value}%`, 'Винрейт']}
                {...tooltipStyle}
              />
              <Line
                type="monotone"
                dataKey="winrate"
                stroke="#22c55e"
                strokeWidth={2.5}
                dot={{ fill: '#22c55e', r: 4, strokeWidth: 0 }}
                activeDot={{ r: 6, strokeWidth: 0 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </Card>

        {/* Confidence distribution */}
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

        {/* ROI by league */}
        <Card className="p-5 border-border/50 lg:col-span-2">
          <h3 className="text-sm font-semibold text-foreground mb-4">
            ROI по лигам
          </h3>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={roiByLeague} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" horizontal={false} />
              <XAxis
                type="number"
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
                width={90}
              />
              <Tooltip
                formatter={(value: number) => [`+${value}%`, 'ROI']}
                {...tooltipStyle}
              />
              <Bar dataKey="roi" radius={[0, 4, 4, 0]} fill="#22c55e" barSize={28}>
                {roiByLeague.map((entry, index) => (
                  <Cell
                    key={index}
                    fill={entry.roi > 15 ? '#22c55e' : entry.roi > 10 ? '#3b82f6' : '#f59e0b'}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </Card>
      </div>
    </div>
  );
}
