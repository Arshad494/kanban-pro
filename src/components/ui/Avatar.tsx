import { cn } from '../../utils';
import type { User } from '../../types';

interface AvatarProps {
  user: User | null;
  size?: 'xs' | 'sm' | 'md' | 'lg';
  className?: string;
  showTooltip?: boolean;
}

const sizes = {
  xs: 'h-5 w-5 text-[9px]',
  sm: 'h-7 w-7 text-xs',
  md: 'h-9 w-9 text-sm',
  lg: 'h-11 w-11 text-base',
};

export function Avatar({ user, size = 'sm', className, showTooltip = false }: AvatarProps) {
  if (!user) {
    return (
      <div
        className={cn(
          'rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center shrink-0',
          sizes[size],
          className
        )}
      >
        <span className="text-gray-400 dark:text-gray-500 text-[9px]">?</span>
      </div>
    );
  }

  return (
    <div className={cn('relative group shrink-0', className)}>
      <div
        className={cn(
          'rounded-full flex items-center justify-center font-semibold text-white shrink-0 ring-2 ring-white dark:ring-gray-900 overflow-hidden select-none',
          sizes[size]
        )}
        style={{ backgroundColor: user.color }}
        title={showTooltip ? `${user.name} · ${user.role}` : user.name}
      >
        {user.avatar}
      </div>
    </div>
  );
}

interface AvatarGroupProps {
  users: User[];
  max?: number;
  size?: AvatarProps['size'];
}

export function AvatarGroup({ users, max = 4, size = 'sm' }: AvatarGroupProps) {
  const shown = users.slice(0, max);
  const overflow = users.slice(max);

  return (
    <div className="flex -space-x-2">
      {shown.map((u) => (
        <Avatar key={u.id} user={u} size={size} showTooltip />
      ))}
      {overflow.length > 0 && (
        <div
          className={cn(
            'rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center text-gray-600 dark:text-gray-300 font-semibold ring-2 ring-white dark:ring-gray-900 shrink-0 text-[10px] cursor-default',
            sizes[size]
          )}
          title={overflow.map((u) => u.name).join(', ')}
        >
          +{overflow.length}
        </div>
      )}
    </div>
  );
}
