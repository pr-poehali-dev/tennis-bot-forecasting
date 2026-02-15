import { useState, useMemo } from 'react';
import Sidebar from '@/components/Sidebar';
import StatsBar from '@/components/StatsBar';
import MatchCard from '@/components/MatchCard';
import FilterPanel from '@/components/FilterPanel';
import AnalyticsPanel from '@/components/AnalyticsPanel';
import ResultsPanel from '@/components/ResultsPanel';
import { Card } from '@/components/ui/card';
import Icon from '@/components/ui/icon';
import { getFilteredMatches, getPredictionStats } from '@/data/matches';
import type { MatchFilters } from '@/data/matches';

export default function Index() {
  const [activeTab, setActiveTab] = useState('predictions');
  const [filters, setFilters] = useState<MatchFilters>({
    status: 'all',
  });

  const stats = getPredictionStats();

  const filteredMatches = useMemo(() => {
    const baseFilters = { ...filters };

    // For predictions tab, only show upcoming/live with predictions
    if (activeTab === 'predictions') {
      const liveAndUpcoming = getFilteredMatches({ ...baseFilters, status: 'all' }).filter(
        (m) => (m.status === 'upcoming' || m.status === 'live') && m.prediction
      );

      // Apply other filters manually
      return liveAndUpcoming.filter((m) => {
        if (baseFilters.minOdds) {
          const minOdd = Math.min(m.odds.p1Win, m.odds.p2Win);
          if (minOdd < baseFilters.minOdds) return false;
        }
        if (baseFilters.maxOdds) {
          const maxOdd = Math.max(m.odds.p1Win, m.odds.p2Win);
          if (maxOdd > baseFilters.maxOdds) return false;
        }
        if (baseFilters.minConfidence && m.prediction) {
          if (m.prediction.confidence < baseFilters.minConfidence) return false;
        }
        return true;
      });
    }

    return getFilteredMatches(baseFilters);
  }, [filters, activeTab]);

  const renderContent = () => {
    switch (activeTab) {
      case 'predictions':
        return (
          <div className="space-y-4 animate-fade-in">
            <FilterPanel filters={filters} onFiltersChange={setFilters} />
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
                <Icon name="TrendingUp" size={20} className="text-primary" />
                Активные прогнозы
              </h2>
              <span className="text-sm text-muted-foreground">
                {filteredMatches.length} матчей
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

      case 'matches':
        return (
          <div className="space-y-4 animate-fade-in">
            <FilterPanel filters={filters} onFiltersChange={setFilters} />
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
                <Icon name="Zap" size={20} className="text-primary" />
                Все матчи
              </h2>
              <span className="text-sm text-muted-foreground">
                {filteredMatches.length} матчей
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
            <AnalyticsPanel />
          </div>
        );

      case 'stats':
        return (
          <div className="space-y-4 animate-fade-in">
            <div className="flex items-center gap-2 mb-2">
              <Icon name="PieChart" size={20} className="text-primary" />
              <h2 className="text-lg font-bold text-foreground">Подробная статистика</h2>
            </div>

            <StatsBar />

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
                  {stats.correctPredictions} из {stats.totalPredictions} прогнозов
                </p>
              </Card>

              <Card className="p-5 border-border/50">
                <div className="flex items-center gap-3 mb-3">
                  <div className="bg-amber-500/10 p-2.5 rounded-lg">
                    <Icon name="Coins" size={18} className="text-amber-500" />
                  </div>
                  <h3 className="text-sm font-semibold">Средний коэффициент</h3>
                </div>
                <p className="text-3xl font-bold text-amber-500">{stats.avgOdds}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  По всем прогнозам
                </p>
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
                  {((stats.todayCorrect / stats.todayPredictions) * 100).toFixed(0)}% точность сегодня
                </p>
              </Card>

              <Card className="p-5 border-border/50">
                <div className="flex items-center gap-3 mb-3">
                  <div className="bg-orange-400/10 p-2.5 rounded-lg">
                    <Icon name="Flame" size={18} className="text-orange-400" />
                  </div>
                  <h3 className="text-sm font-semibold">Текущая серия</h3>
                </div>
                <p className="text-3xl font-bold text-orange-400">{stats.streak}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Подряд верных прогнозов
                </p>
              </Card>

              <Card className="p-5 border-border/50">
                <div className="flex items-center gap-3 mb-3">
                  <div className="bg-purple-400/10 p-2.5 rounded-lg">
                    <Icon name="TrendingUp" size={18} className="text-purple-400" />
                  </div>
                  <h3 className="text-sm font-semibold">ROI</h3>
                </div>
                <p className="text-3xl font-bold text-purple-400">+{stats.roi}%</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Возврат инвестиций
                </p>
              </Card>

              <Card className="p-5 border-border/50">
                <div className="flex items-center gap-3 mb-3">
                  <div className="bg-cyan-400/10 p-2.5 rounded-lg">
                    <Icon name="Activity" size={18} className="text-cyan-400" />
                  </div>
                  <h3 className="text-sm font-semibold">Всего прогнозов</h3>
                </div>
                <p className="text-3xl font-bold text-cyan-400">{stats.totalPredictions}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  За все время
                </p>
              </Card>
            </div>
          </div>
        );

      case 'results':
        return (
          <div className="animate-fade-in">
            <ResultsPanel />
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Sidebar activeTab={activeTab} onTabChange={setActiveTab} />

      {/* Main content */}
      <main className="lg:pl-64 pb-20 lg:pb-0">
        <div className="p-4 lg:p-6 max-w-7xl mx-auto space-y-4">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl lg:text-2xl font-bold text-foreground">
                {activeTab === 'predictions' && 'Прогнозы на матчи'}
                {activeTab === 'matches' && 'Все матчи'}
                {activeTab === 'analytics' && 'Аналитика'}
                {activeTab === 'stats' && 'Статистика'}
                {activeTab === 'results' && 'Результаты'}
              </h1>
              <p className="text-sm text-muted-foreground mt-0.5">
                Лига Про | Настольный теннис | {new Date().toLocaleDateString('ru-RU', {
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric',
                })}
              </p>
            </div>
            <div className="hidden lg:flex items-center gap-2 text-xs text-muted-foreground bg-card border border-border/50 rounded-lg px-3 py-2">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-primary" />
              </span>
              <span>Данные обновляются в реальном времени</span>
            </div>
          </div>

          {/* Stats bar - always visible on predictions/matches */}
          {(activeTab === 'predictions' || activeTab === 'matches') && <StatsBar />}

          {/* Tab content */}
          {renderContent()}
        </div>
      </main>
    </div>
  );
}
