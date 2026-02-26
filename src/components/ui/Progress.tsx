import React from 'react';
import { cn } from '../../utils';

interface ProgressProps {
  value: number; // 0–100
  className?: string;
  color?: string;
  showLabel?: boolean;
  size?: 'sm' | 'md';
}

export function Progress({ value, className, color, showLabel = false, size = 'sm' }: ProgressProps) {
  const clamped = Math.min(100, Math.max(0, value));

  const trackColor = 'bg-gray-100 dark:bg-gray-800';
  const fillColor = color
    ? ''
    : clamped === 100
    ? 'bg-green-500'
    : clamped >= 60
    ? 'bg-brand-500'
    : clamped >= 30
    ? 'bg-yellow-500'
    : 'bg-red-500';

  return (
    <div className={cn('flex items-center gap-2', className)}>
      <div className={cn('flex-1 rounded-full overflow-hidden', trackColor, size === 'sm' ? 'h-1.5' : 'h-2.5')}>
        <div
          className={cn('h-full rounded-full transition-all duration-500', fillColor)}
          style={{
            width: `${clamped}%`,
            ...(color ? { backgroundColor: color } : {}),
          }}
        />
      </div>
      {showLabel && (
        <span className="text-xs text-muted font-medium tabular-nums w-8 text-right">{clamped}%</span>
      )}
    </div>
  );
}
