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

function BetTypeBadge({ betType, confidence }: { betType?: string; confidence: number }) {
  if (betType === 'strong') {
    return (
      <Badge className="bg-primary/20 text-primary border-primary/30 text-[10px] px-1.5 py-0">
        ТОП {confidence}%
      </Badge>
    );
  }
  if (betType === 'medium') {
    return (
      <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30 text-[10px] px-1.5 py-0">
        СРЕДНИЙ {confidence}%
      </Badge>
    );
  }
  if (betType === 'risky') {
    return (
      <Badge className="bg-amber-500/20 text-amber-400 border-amber-500/30 text-[10px] px-1.5 py-0">
        РИСК {confidence}%
      </Badge>
    );
  }
  return null;
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
  isPredicted,
  score,
  align,
}: {
  player: Match['player1'];
  isWinner?: boolean;
  isPredicted?: boolean;
  score?: number;
  align: 'left' | 'right';
}) {
  return (
    <div className={cn('flex-1 space-y-1.5', align === 'right' && 'text-right')}>
      <div className={cn('flex items-center gap-1.5', align === 'right' && 'justify-end')}>
        {isPredicted && align === 'left' && (
          <Icon name="ArrowRight" size={10} className="text-primary" />
        )}
        <p className={cn(
          'text-sm font-semibold truncate',
          isWinner ? 'text-primary' : isPredicted ? 'text-primary/80' : 'text-foreground'
        )}>
          {player.name}
        </p>
        {isPredicted && align === 'right' && (
          <Icon name="ArrowLeft" size={10} className="text-primary" />
        )}
      </div>
      <div className={cn('flex items-center gap-2 text-xs text-muted-foreground', align === 'right' && 'justify-end')}>
        <span>R: {player.rating}</span>
        <span className="text-primary/80">{player.winRate}%</span>
      </div>
      <div className={cn('flex items-center gap-1.5', align === 'right' && 'justify-end')}>
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
  const betType = match.prediction?.betType;

  const glowClass = betType === 'strong'
    ? 'glow-green border-primary/30'
    : betType === 'medium'
      ? 'border-blue-500/20'
      : 'border-border/30';

  const predictedWinnerName = match.prediction?.winner === 'p1'
    ? match.player1.name
    : match.player2.name;

  const isP1Winner = match.status === 'finished' && match.score
    ? match.score.p1 > match.score.p2
    : undefined;

  const isP1Predicted = match.prediction?.winner === 'p1';

  const timeStr = new Date(match.startTime).toLocaleTimeString('ru-RU', {
    hour: '2-digit',
    minute: '2-digit',
  });

  const wasCorrect = match.status === 'finished' && match.prediction && match.score
    ? (isP1Predicted && match.score.p1 > match.score.p2) || (!isP1Predicted && match.score.p2 > match.score.p1)
    : undefined;

  return (
    <Card className={cn(
      'p-4 transition-all duration-200 hover:scale-[1.01] hover:brightness-110 relative',
      glowClass,
      match.status === 'live' && 'ring-1 ring-red-500/20'
    )}>
      {wasCorrect !== undefined && (
        <div className={cn(
          'absolute top-2 right-2 w-5 h-5 rounded-full flex items-center justify-center',
          wasCorrect ? 'bg-primary/20' : 'bg-red-500/20'
        )}>
          <Icon name={wasCorrect ? 'Check' : 'X'} size={12} className={wasCorrect ? 'text-primary' : 'text-red-400'} />
        </div>
      )}

      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Icon name="MapPin" size={12} />
          <span className="truncate max-w-[140px]">{match.league}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground font-mono">{timeStr}</span>
          <StatusBadge status={match.status} />
        </div>
      </div>

      <div className="flex items-start gap-3 mb-3">
        <PlayerSide
          player={match.player1}
          isWinner={isP1Winner === true}
          isPredicted={isP1Predicted === true}
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
          isPredicted={isP1Predicted === false && match.prediction !== undefined}
          score={match.score?.p2}
          align="right"
        />
      </div>

      <div className="flex items-center justify-between pt-3 border-t border-border/50">
        <div className="flex items-center gap-3">
          <div className="text-center">
            <p className="text-[10px] text-muted-foreground uppercase">П1</p>
            <p className={cn(
              'text-sm font-bold',
              isP1Predicted ? 'text-primary' : 'text-foreground'
            )}>{match.odds.p1Win.toFixed(2)}</p>
          </div>
          <div className="text-center">
            <p className="text-[10px] text-muted-foreground uppercase">П2</p>
            <p className={cn(
              'text-sm font-bold',
              !isP1Predicted && match.prediction ? 'text-primary' : 'text-foreground'
            )}>{match.odds.p2Win.toFixed(2)}</p>
          </div>
        </div>

        {match.prediction && (
          <div className="flex items-center gap-2">
            <BetTypeBadge betType={betType} confidence={confidence} />
            <div className={cn(
              'flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold',
              betType === 'strong'
                ? 'bg-primary/15 text-primary'
                : betType === 'medium'
                  ? 'bg-blue-500/15 text-blue-400'
                  : 'bg-muted text-muted-foreground'
            )}>
              <Icon name="Brain" size={13} />
              <span>{predictedWinnerName}</span>
            </div>
          </div>
        )}
      </div>

      {match.prediction && match.prediction.factors && match.prediction.factors.length > 0 && betType !== 'skip' && (
        <div className="mt-2 pt-2 border-t border-border/30 flex flex-wrap gap-1.5">
          {match.prediction.factors.map((f, i) => (
            <span key={i} className="text-[10px] text-muted-foreground bg-secondary/50 px-2 py-0.5 rounded">
              {f}
            </span>
          ))}
        </div>
      )}
    </Card>
  );
}
