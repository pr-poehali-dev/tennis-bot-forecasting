import { useState } from 'react';
import { Button } from '@/components/ui/button';
import Icon from '@/components/ui/icon';
import { cn } from '@/lib/utils';

const TG_SEND_URL = 'https://functions.poehali.dev/2e6fdee9-bf8a-4481-aeeb-09115fd7c6da';

interface TelegramButtonProps {
  mode: 'predictions' | 'results';
  className?: string;
}

export default function TelegramButton({ mode, className }: TelegramButtonProps) {
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');

  const send = async () => {
    setStatus('loading');
    try {
      const res = await fetch(TG_SEND_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mode }),
      });
      const data = await res.json();
      setStatus(data.success ? 'success' : 'error');
    } catch {
      setStatus('error');
    }
    setTimeout(() => setStatus('idle'), 3000);
  };

  const label = {
    idle: mode === 'predictions' ? 'Отправить в Telegram' : 'Результаты в Telegram',
    loading: 'Отправка...',
    success: 'Отправлено!',
    error: 'Ошибка — настройте токен',
  }[status];

  const icon = {
    idle: 'Send',
    loading: 'Loader2',
    success: 'Check',
    error: 'AlertCircle',
  }[status];

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={send}
      disabled={status === 'loading'}
      className={cn(
        'gap-2 text-xs transition-all',
        status === 'success' && 'border-primary/50 text-primary',
        status === 'error' && 'border-red-500/50 text-red-400',
        className
      )}
    >
      <Icon
        name={icon}
        size={14}
        className={cn(status === 'loading' && 'animate-spin')}
      />
      {label}
    </Button>
  );
}
