import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import Icon from '@/components/ui/icon';
import { cn } from '@/lib/utils';
import type { Match } from '@/data/matches';

interface MatchCardProps {
  match: Match;
}

function StatusBadge({ status }: { status: Match['status'] }) {
  if (status === 'live') {
    return (
      <Badge className="bg-red-500/20 text-red-400 border-red-500/30 gap-1.5">
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
          <span className="relative inline-flex rounded-full h-2 w-2 bg-red-400" />
        </span>
        LIVE
      </Badge>
    );
  }
  if (status === 'upcoming') {
    return (
      <Badge className="bg-amber-500/20 text-amber-400 border-amber-500/30">
        Ожидается
      </Badge>
    );
  }
  return (
    <Badge className="bg-muted text-muted-foreground border-border">
      Завершен
    </Badge>
  );
}

function FormDots({ form }: { form: ('W' | 'L')[] }) {
  return (
    <div className="flex gap-1">
      {form.map((result, i) => (
        <span
          key={i}
          className={cn(
            'w-1.5 h-1.5 rounded-full',
            result === 'W' ? 'bg-primary' : 'bg-red-500'
          )}
        />
      ))}
    </div>
  );
}

function PlayerSide({
  player,
  isWinner,
  score,
  align,
}: {
  player: Match['player1'];
  isWinner?: boolean;
  score?: number;
  align: 'left' | 'right';
}) {
  return (
    <div className={cn('flex-1 space-y-1.5', align === 'right' && 'text-right')}>
      <p className={cn(
        'text-sm font-semibold truncate',
        isWinner ? 'text-primary' : 'text-foreground'
      )}>
        {player.name}
      </p>
      <div className={cn('flex items-center gap-2 text-xs text-muted-foreground', align === 'right' && 'justify-end')}>
        <span>R: {player.rating}</span>
        <span className="text-primary/80">{player.winRate}%</span>
      </div>
      <div className={cn('flex items-center gap-1.5', align === 'right' && 'justify-end')}>
        <span className="text-[10px] text-muted-foreground uppercase">Форма</span>
        <FormDots form={player.recentForm} />
      </div>
      {score !== undefined && (
        <p className={cn(
          'text-2xl font-bold tabular-nums',
          isWinner ? 'text-primary' : 'text-muted-foreground'
        )}>
          {score}
        </p>
      )}
    </div>
  );
}

export default function MatchCard({ match }: MatchCardProps) {
  const confidence = match.prediction?.confidence ?? 0;
  const glowClass = confidence > 75
    ? 'glow-green border-primary/30'
    : confidence >= 60
      ? 'border-border/50'
      : 'border-border/30 opacity-90';

  const predictedWinnerName = match.prediction?.winner === 'p1'
    ? match.player1.name
    : match.player2.name;

  const isP1Winner = match.status === 'finished' && match.score
    ? match.score.p1 > match.score.p2
    : undefined;

  const timeStr = new Date(match.startTime).toLocaleTimeString('ru-RU', {
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <Card className={cn(
      'p-4 transition-all duration-200 hover:scale-[1.01] hover:brightness-110 cursor-pointer',
      glowClass
    )}>
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Icon name="MapPin" size={12} />
          <span>{match.league}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">{timeStr}</span>
          <StatusBadge status={match.status} />
        </div>
      </div>

      {/* Players */}
      <div className="flex items-start gap-3 mb-3">
        <PlayerSide
          player={match.player1}
          isWinner={isP1Winner === true}
          score={match.score?.p1}
          align="left"
        />
        <div className="flex flex-col items-center justify-center pt-1">
          <span className="text-xs font-bold text-muted-foreground">VS</span>
          {match.sets && match.sets.length > 0 && (
            <div className="mt-2 space-y-0.5">
              {match.sets.map((set, i) => (
                <div key={i} className="flex gap-1 text-[10px] text-muted-foreground tabular-nums">
                  <span className={cn(set.p1 > set.p2 && 'text-primary font-semibold')}>{set.p1}</span>
                  <span>:</span>
                  <span className={cn(set.p2 > set.p1 && 'text-primary font-semibold')}>{set.p2}</span>
                </div>
              ))}
            </div>
          )}
        </div>
        <PlayerSide
          player={match.player2}
          isWinner={isP1Winner === false}
          score={match.score?.p2}
          align="right"
        />
      </div>

      {/* Footer: Odds + Prediction */}
      <div className="flex items-center justify-between pt-3 border-t border-border/50">
        <div className="flex items-center gap-3">
          <div className="text-center">
            <p className="text-[10px] text-muted-foreground uppercase">П1</p>
            <p className="text-sm font-bold text-foreground">{match.odds.p1Win.toFixed(2)}</p>
          </div>
          <div className="text-center">
            <p className="text-[10px] text-muted-foreground uppercase">П2</p>
            <p className="text-sm font-bold text-foreground">{match.odds.p2Win.toFixed(2)}</p>
          </div>
        </div>

        {match.prediction && (
          <div className={cn(
            'flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold',
            confidence > 75
              ? 'bg-primary/15 text-primary'
              : confidence >= 60
                ? 'bg-blue-500/15 text-blue-400'
                : 'bg-muted text-muted-foreground'
          )}>
            <Icon name="Brain" size={14} />
            <span>{predictedWinnerName}</span>
            <span className="opacity-70">{confidence}%</span>
          </div>
        )}
      </div>
    </Card>
  );
}
