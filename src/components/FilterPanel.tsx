import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Slider } from '@/components/ui/slider';
import Icon from '@/components/ui/icon';
import { cn } from '@/lib/utils';
import type { MatchFilters } from '@/data/matches';

interface FilterPanelProps {
  filters: MatchFilters;
  onFiltersChange: (filters: MatchFilters) => void;
}

const statusOptions: { value: MatchFilters['status']; label: string }[] = [
  { value: 'all', label: 'Все' },
  { value: 'live', label: 'Live' },
  { value: 'upcoming', label: 'Ожидаемые' },
  { value: 'finished', label: 'Завершенные' },
];

export default function FilterPanel({ filters, onFiltersChange }: FilterPanelProps) {
  const update = (patch: Partial<MatchFilters>) =>
    onFiltersChange({ ...filters, ...patch });

  const reset = () =>
    onFiltersChange({
      minOdds: undefined,
      maxOdds: undefined,
      minConfidence: undefined,
      status: 'all',
    });

  return (
    <div className="bg-card border border-border/50 rounded-lg p-4 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
          <Icon name="SlidersHorizontal" size={16} />
          <span>Фильтры</span>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={reset}
          className="text-xs text-muted-foreground hover:text-foreground h-7"
        >
          <Icon name="RotateCcw" size={12} />
          Сбросить фильтры
        </Button>
      </div>

      <div className="flex flex-wrap items-end gap-4">
        {/* Status filter */}
        <div className="space-y-1.5">
          <label className="text-xs text-muted-foreground">Статус</label>
          <div className="flex gap-1">
            {statusOptions.map((opt) => (
              <Button
                key={opt.value}
                variant="ghost"
                size="sm"
                onClick={() => update({ status: opt.value })}
                className={cn(
                  'h-8 px-3 text-xs rounded-md',
                  (filters.status || 'all') === opt.value
                    ? 'bg-primary/15 text-primary hover:bg-primary/20 hover:text-primary'
                    : 'text-muted-foreground hover:text-foreground'
                )}
              >
                {opt.label}
              </Button>
            ))}
          </div>
        </div>

        {/* Min odds */}
        <div className="space-y-1.5">
          <label className="text-xs text-muted-foreground">Мин. коэфф.</label>
          <Input
            type="number"
            step="0.1"
            min="1"
            max="10"
            placeholder="1.00"
            value={filters.minOdds ?? ''}
            onChange={(e) =>
              update({ minOdds: e.target.value ? parseFloat(e.target.value) : undefined })
            }
            className="w-24 h-8 text-xs bg-secondary border-border"
          />
        </div>

        {/* Max odds */}
        <div className="space-y-1.5">
          <label className="text-xs text-muted-foreground">Макс. коэфф.</label>
          <Input
            type="number"
            step="0.1"
            min="1"
            max="10"
            placeholder="10.00"
            value={filters.maxOdds ?? ''}
            onChange={(e) =>
              update({ maxOdds: e.target.value ? parseFloat(e.target.value) : undefined })
            }
            className="w-24 h-8 text-xs bg-secondary border-border"
          />
        </div>

        {/* Min confidence */}
        <div className="space-y-1.5 flex-1 min-w-[200px]">
          <div className="flex items-center justify-between">
            <label className="text-xs text-muted-foreground">Мин. уверенность</label>
            <span className="text-xs font-semibold text-primary">
              {filters.minConfidence ?? 0}%
            </span>
          </div>
          <Slider
            value={[filters.minConfidence ?? 0]}
            onValueChange={([val]) => update({ minConfidence: val })}
            min={0}
            max={100}
            step={5}
            className="w-full"
          />
        </div>
      </div>
    </div>
  );
}
