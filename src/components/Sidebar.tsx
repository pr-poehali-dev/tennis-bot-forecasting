import Icon from '@/components/ui/icon';
import { cn } from '@/lib/utils';
import type { PredictionStats } from '@/data/matches';

interface SidebarProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  stats: PredictionStats;
}

const navItems = [
  { id: 'predictions', label: 'Прогнозы', icon: 'TrendingUp' },
  { id: 'matches', label: 'Матчи', icon: 'Zap' },
  { id: 'analytics', label: 'Аналитика', icon: 'BarChart3' },
  { id: 'stats', label: 'Статистика', icon: 'PieChart' },
  { id: 'results', label: 'Результаты', icon: 'Trophy' },
];

export default function Sidebar({ activeTab, onTabChange, stats }: SidebarProps) {

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden lg:flex fixed left-0 top-0 bottom-0 w-64 flex-col bg-card border-r border-border z-40">
        {/* Logo */}
        <div className="p-6 border-b border-border">
          <div className="flex items-center gap-3">
            <span className="text-2xl">&#127955;</span>
            <div>
              <h1 className="text-lg font-bold text-foreground tracking-tight">TT Predict</h1>
              <p className="text-xs text-muted-foreground">Лига Про Аналитика</p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 py-4 px-3 space-y-1">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => onTabChange(item.id)}
              className={cn(
                'w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200',
                activeTab === item.id
                  ? 'bg-primary/10 text-primary border-l-2 border-primary'
                  : 'text-muted-foreground hover:text-foreground hover:bg-secondary/50'
              )}
            >
              <Icon name={item.icon} size={18} />
              <span>{item.label}</span>
            </button>
          ))}
        </nav>

        {/* Admin button */}
        <div className="px-4 pb-3">
          <a
            href="/admin"
            className="w-full flex items-center gap-3 px-4 py-3 rounded-lg bg-primary/10 hover:bg-primary/20 text-primary border border-primary/30 transition-all duration-200"
          >
            <Icon name="Settings" size={18} />
            <div className="flex-1 text-left">
              <div className="text-sm font-semibold">Админка</div>
              <div className="text-xs opacity-80">Добавить матчи</div>
            </div>
            <Icon name="ChevronRight" size={16} />
          </a>
        </div>

        {/* Bottom stats card */}
        <div className="p-4 border-t border-border">
          <div className="bg-secondary/50 rounded-lg p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">Винрейт</span>
              <span className="text-sm font-bold text-primary">{stats.winRate}%</span>
            </div>
            <div className="w-full bg-secondary rounded-full h-1.5">
              <div
                className="bg-primary h-1.5 rounded-full transition-all"
                style={{ width: `${stats.winRate}%` }}
              />
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">ROI</span>
              <span className="text-sm font-bold text-amber-500">+{stats.roi}%</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">Прогнозов</span>
              <span className="text-sm font-semibold text-foreground">{stats.totalPredictions}</span>
            </div>
          </div>
        </div>
      </aside>

      {/* Mobile bottom nav */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-card border-t border-border z-50 flex items-center justify-around px-2 py-2 safe-area-bottom">
        {navItems.map((item) => (
          <button
            key={item.id}
            onClick={() => onTabChange(item.id)}
            className={cn(
              'flex flex-col items-center gap-1 px-3 py-1.5 rounded-lg transition-colors text-xs',
              activeTab === item.id
                ? 'text-primary'
                : 'text-muted-foreground'
            )}
          >
            <Icon name={item.icon} size={20} />
            <span className="font-medium">{item.label}</span>
          </button>
        ))}
      </nav>
    </>
  );
}