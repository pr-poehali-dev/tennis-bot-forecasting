import { useState, useMemo } from 'react';
import Sidebar from '@/components/Sidebar';
import StatsBar from '@/components/StatsBar';
import MatchCard from '@/components/MatchCard';
import FilterPanel from '@/components/FilterPanel';
import AnalyticsPanel from '@/components/AnalyticsPanel';
import ResultsPanel from '@/components/ResultsPanel';
import TelegramButton from '@/components/TelegramButton';
import { Card } from '@/components/ui/card';
import Icon from '@/components/ui/icon';
import { Badge } from '@/components/ui/badge';
import { filterMatches, calcStats } from '@/data/matches';
import type { MatchFilters } from '@/data/matches';
import { useMatches } from '@/hooks/use-matches';

export default function Index() {
  const [activeTab, setActiveTab] = useState('predictions');
  const [filters, setFilters] = useState<MatchFilters>({ status: 'all' });
  const { data, isLoading, error, dataUpdatedAt } = useMatches();

  const matches = data?.matches ?? [];
  const leagues = data?.leagues ?? [];
  const stats = useMemo(() => calcStats(matches), [matches]);

  const liveCount = data?.liveCount ?? 0;
  const highConfCount = data?.highConfCount ?? 0;

  const filteredMatches = useMemo(() => {
    if (activeTab === 'predictions') {
      const active = matches.filter(
        (m) => (m.status === 'upcoming' || m.status === 'live') && m.prediction
      );
      return filterMatches(active, { ...filters, status: 'all' });
    }
    return filterMatches(matches, filters);
  }, [filters, activeTab, matches]);

  const renderContent = () => {
    if (isLoading) {
      return (
        <div className="flex flex-col items-center justify-center py-20 gap-3 animate-fade-in">
          <div className="w-10 h-10 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-muted-foreground">Загружаю матчи...</p>
          <p className="text-xs text-muted-foreground/60">Лига Про Россия · Мастерс Минск</p>
        </div>
      );
    }

    if (error) {
      return (
        <div className="flex flex-col items-center justify-center py-20 gap-3 animate-fade-in">
          <Icon name="WifiOff" size={40} className="text-red-400 opacity-60" />
          <p className="text-sm text-muted-foreground">Не удалось загрузить матчи</p>
          <p className="text-xs text-muted-foreground/60">Автообновление через 15 сек</p>
        </div>
      );
    }

    switch (activeTab) {
      case 'predictions':
        return (
          <div className="space-y-4 animate-fade-in">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              <Card className="p-3 border-border/50 flex items-center gap-2">
                <div className="bg-red-500/10 p-2 rounded-lg">
                  <Icon name="Radio" size={16} className="text-red-400" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Live</p>
                  <p className="text-lg font-bold text-red-400">{liveCount}</p>
                </div>
              </Card>
              <Card className="p-3 border-border/50 flex items-center gap-2">
                <div className="bg-primary/10 p-2 rounded-lg">
                  <Icon name="Crosshair" size={16} className="text-primary" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Топ прогнозы</p>
                  <p className="text-lg font-bold text-primary">{highConfCount}</p>
                </div>
              </Card>
              <Card className="p-3 border-border/50 flex items-center gap-2">
                <div className="bg-amber-500/10 p-2 rounded-lg">
                  <Icon name="Target" size={16} className="text-amber-500" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Винрейт</p>
                  <p className="text-lg font-bold text-amber-500">{stats.winRate}%</p>
                </div>
              </Card>
              <Card className="p-3 border-border/50 flex items-center gap-2">
                <div className="bg-blue-400/10 p-2 rounded-lg">
                  <Icon name="Layers" size={16} className="text-blue-400" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Лиги</p>
                  <p className="text-lg font-bold text-blue-400">{leagues.length}</p>
                </div>
              </Card>
            </div>

            <FilterPanel filters={filters} onFiltersChange={setFilters} leagues={leagues} />

            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
                <Icon name="TrendingUp" size={20} className="text-primary" />
                Активные прогнозы
              </h2>
              <div className="flex items-center gap-2">
                <TelegramButton mode="predictions" />
                <span className="text-sm text-muted-foreground">
                  {filteredMatches.length}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-2 gap-3">
              {filteredMatches.map((match) => (
                <MatchCard key={match.id} match={match} />
              ))}
            </div>
            {filteredMatches.length === 0 && (
              <div className="text-center py-12 text-muted-foreground">
                <Icon name="SearchX" size={40} className="mx-auto mb-3 opacity-50" />
                <p className="text-sm">Нет матчей по заданным фильтрам</p>
                <p className="text-xs text-muted-foreground/60 mt-1">Попробуйте сбросить фильтры или подождать обновления</p>
              </div>
            )}
          </div>
        );

      case 'matches':
        return (
          <div className="space-y-4 animate-fade-in">
            <FilterPanel filters={filters} onFiltersChange={setFilters} leagues={leagues} />
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
                <Icon name="Zap" size={20} className="text-primary" />
                Все матчи
              </h2>
              <span className="text-sm text-muted-foreground">
                {filteredMatches.length}
              </span>
            </div>
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-3">
              {filteredMatches.map((match) => (
                <MatchCard key={match.id} match={match} />
              ))}
            </div>
            {filteredMatches.length === 0 && (
              <div className="text-center py-12 text-muted-foreground">
                <Icon name="SearchX" size={40} className="mx-auto mb-3 opacity-50" />
                <p className="text-sm">Нет матчей по заданным фильтрам</p>
              </div>
            )}
          </div>
        );

      case 'analytics':
        return (
          <div className="animate-fade-in">
            <AnalyticsPanel matches={matches} />
          </div>
        );

      case 'stats':
        return (
          <div className="space-y-4 animate-fade-in">
            <div className="flex items-center gap-2 mb-2">
              <Icon name="PieChart" size={20} className="text-primary" />
              <h2 className="text-lg font-bold text-foreground">Подробная статистика</h2>
            </div>

            <StatsBar stats={stats} />

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              <Card className="p-5 border-border/50">
                <div className="flex items-center gap-3 mb-3">
                  <div className="bg-primary/10 p-2.5 rounded-lg">
                    <Icon name="CheckCircle" size={18} className="text-primary" />
                  </div>
                  <h3 className="text-sm font-semibold">Точность</h3>
                </div>
                <p className="text-3xl font-bold text-primary">{stats.winRate}%</p>
                <p className="text-xs text-muted-foreground mt-1">
                  {stats.correctPredictions} из {stats.totalPredictions}
                </p>
              </Card>

              <Card className="p-5 border-border/50">
                <div className="flex items-center gap-3 mb-3">
                  <div className="bg-amber-500/10 p-2.5 rounded-lg">
                    <Icon name="Coins" size={18} className="text-amber-500" />
                  </div>
                  <h3 className="text-sm font-semibold">Средний коэфф.</h3>
                </div>
                <p className="text-3xl font-bold text-amber-500">{stats.avgOdds}</p>
                <p className="text-xs text-muted-foreground mt-1">По всем прогнозам</p>
              </Card>

              <Card className="p-5 border-border/50">
                <div className="flex items-center gap-3 mb-3">
                  <div className="bg-orange-400/10 p-2.5 rounded-lg">
                    <Icon name="Flame" size={18} className="text-orange-400" />
                  </div>
                  <h3 className="text-sm font-semibold">Серия побед</h3>
                </div>
                <p className="text-3xl font-bold text-orange-400">{stats.streak}</p>
                <p className="text-xs text-muted-foreground mt-1">Подряд верных</p>
              </Card>

              <Card className="p-5 border-border/50">
                <div className="flex items-center gap-3 mb-3">
                  <div className="bg-purple-400/10 p-2.5 rounded-lg">
                    <Icon name="TrendingUp" size={18} className="text-purple-400" />
                  </div>
                  <h3 className="text-sm font-semibold">ROI</h3>
                </div>
                <p className="text-3xl font-bold text-purple-400">+{stats.roi}%</p>
                <p className="text-xs text-muted-foreground mt-1">Возврат инвестиций</p>
              </Card>

              <Card className="p-5 border-border/50">
                <div className="flex items-center gap-3 mb-3">
                  <div className="bg-blue-400/10 p-2.5 rounded-lg">
                    <Icon name="Calendar" size={18} className="text-blue-400" />
                  </div>
                  <h3 className="text-sm font-semibold">Сегодня</h3>
                </div>
                <p className="text-3xl font-bold text-blue-400">
                  {stats.todayCorrect}/{stats.todayPredictions}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  {stats.todayPredictions > 0 ? ((stats.todayCorrect / stats.todayPredictions) * 100).toFixed(0) : 0}%
                </p>
              </Card>

              <Card className="p-5 border-border/50">
                <div className="flex items-center gap-3 mb-3">
                  <div className="bg-cyan-400/10 p-2.5 rounded-lg">
                    <Icon name="Activity" size={18} className="text-cyan-400" />
                  </div>
                  <h3 className="text-sm font-semibold">Всего</h3>
                </div>
                <p className="text-3xl font-bold text-cyan-400">{stats.totalPredictions}</p>
                <p className="text-xs text-muted-foreground mt-1">Прогнозов обработано</p>
              </Card>
            </div>
          </div>
        );

      case 'results':
        return (
          <div className="space-y-4 animate-fade-in">
            <div className="flex items-center justify-end">
              <TelegramButton mode="results" />
            </div>
            <ResultsPanel matches={matches} />
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Sidebar activeTab={activeTab} onTabChange={setActiveTab} stats={stats} />

      <main className="lg:ml-64 p-4 lg:p-6 pb-24 lg:pb-6">
        <div className="max-w-6xl mx-auto space-y-6">
          <div className="flex items-center justify-between">
            <div className="lg:hidden flex items-center gap-3">
              <span className="text-2xl">&#127955;</span>
              <h1 className="text-lg font-bold text-foreground">TT Predict</h1>
            </div>
            <div className="flex items-center gap-2 ml-auto">
              {data?.source === 'live' && (
                <Badge className="bg-primary/15 text-primary border-primary/30 gap-1">
                  <span className="relative flex h-1.5 w-1.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75" />
                    <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-primary" />
                  </span>
                  Live API
                </Badge>
              )}
              {data?.source === 'generated' && (
                <Badge className="bg-amber-500/15 text-amber-400 border-amber-500/30 gap-1 text-xs">
                  Симуляция
                </Badge>
              )}
              {liveCount > 0 && (
                <Badge className="bg-red-500/15 text-red-400 border-red-500/30 gap-1 text-xs">
                  {liveCount} live
                </Badge>
              )}
              {dataUpdatedAt > 0 && (
                <span className="text-[10px] text-muted-foreground font-mono">
                  {new Date(dataUpdatedAt).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                </span>
              )}
            </div>
          </div>

          {renderContent()}
        </div>
      </main>
    </div>
  );
}
