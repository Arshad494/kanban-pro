import { CircleDot, ArrowUp, Minus, ArrowDown } from 'lucide-react';
import { type Priority, PRIORITY_CONFIG } from '../types';
import { cn } from '../utils';
import React from 'react';

const ICONS: Record<Priority, React.ElementType> = {
  critical: CircleDot,
  high:     ArrowUp,
  medium:   Minus,
  low:      ArrowDown,
};

interface PriorityBadgeProps {
  priority: Priority;
  compact?: boolean;
}

export function PriorityBadge({ priority, compact = false }: PriorityBadgeProps) {
  const config = PRIORITY_CONFIG[priority];
  const Icon = ICONS[priority];

  if (compact) {
    return (
      <div
        className="h-4 w-4 rounded-full flex items-center justify-center shrink-0"
        style={{ color: config.color }}
        title={config.label}
      >
        <Icon className="h-3 w-3" />
      </div>
    );
  }

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold shrink-0',
        config.bg,
        config.darkBg
      )}
      style={{ color: config.color }}
    >
      <Icon className="h-2.5 w-2.5" />
      {config.label}
    </span>
  );
}
