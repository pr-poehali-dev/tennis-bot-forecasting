import Icon from '@/components/ui/icon';
import { Card } from '@/components/ui/card';
import type { PredictionStats } from '@/data/matches';

interface StatsBarProps {
  stats: PredictionStats;
}

export default function StatsBar({ stats }: StatsBarProps) {

  const statItems = [
    {
      label: 'Винрейт',
      value: `${stats.winRate}%`,
      icon: 'Target',
      color: 'text-primary',
      bgColor: 'bg-primary/10',
    },
    {
      label: 'Прогнозов сегодня',
      value: `${stats.todayCorrect}/${stats.todayPredictions}`,
      icon: 'CalendarCheck',
      color: 'text-blue-400',
      bgColor: 'bg-blue-400/10',
    },
    {
      label: 'Серия побед',
      value: stats.streak.toString(),
      icon: 'Flame',
      color: 'text-orange-400',
      bgColor: 'bg-orange-400/10',
    },
    {
      label: 'ROI',
      value: `+${stats.roi}%`,
      icon: 'TrendingUp',
      color: 'text-amber-500',
      bgColor: 'bg-amber-500/10',
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
      {statItems.map((item) => (
        <Card key={item.label} className="p-4 border-border/50">
          <div className="flex items-center gap-3">
            <div className={`${item.bgColor} p-2.5 rounded-lg`}>
              <Icon name={item.icon} size={18} className={item.color} />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">{item.label}</p>
              <p className={`text-xl font-bold ${item.color}`}>{item.value}</p>
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
}