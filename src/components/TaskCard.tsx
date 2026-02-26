import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Calendar, MessageSquare, GripVertical } from 'lucide-react';
import type { Task } from '../types';
import { cn, formatDate, isDueSoon, isOverdue, getTagColor } from '../utils';
import { Avatar } from './ui/Avatar';
import { PriorityBadge } from './PriorityBadge';

interface TaskCardProps {
  task: Task;
  onClick: () => void;
}

export function TaskCard({ task, onClick }: TaskCardProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: task.id,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const checkedItems = task.checklist.filter((c) => c.done).length;
  const totalItems = task.checklist.length;
  const checklistPct = totalItems > 0 ? Math.round((checkedItems / totalItems) * 100) : 0;
  const checklistDone = totalItems > 0 && checkedItems === totalItems;
  const overdue = isOverdue(task.dueDate);
  const dueSoon = isDueSoon(task.dueDate);

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        'group relative bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-3.5 cursor-pointer hover:border-brand-400 dark:hover:border-brand-500 transition-all duration-150 hover:shadow-md',
        isDragging && 'opacity-50 shadow-xl ring-2 ring-brand-400 scale-[0.98]'
      )}
      onClick={onClick}
    >
      {/* Drag handle */}
      <div
        {...attributes}
        {...listeners}
        className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 cursor-grab active:cursor-grabbing text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-opacity"
        onClick={(e) => e.stopPropagation()}
      >
        <GripVertical className="h-4 w-4" />
      </div>

      {/* Title only — priority moved to footer */}
      <div className="mb-2.5 pr-5">
        <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 leading-snug line-clamp-2">
          {task.title}
        </h3>
      </div>

      {/* Tags — rounded-full pill chips */}
      {task.tags.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-2.5">
          {task.tags.slice(0, 3).map((tag) => (
            <span
              key={tag}
              className={cn(
                'text-[10px] px-2 py-0.5 rounded-full font-medium',
                getTagColor(tag)
              )}
            >
              {tag}
            </span>
          ))}
          {task.tags.length > 3 && (
            <span className="text-[10px] px-2 py-0.5 rounded-full font-medium bg-gray-100 text-gray-500 dark:bg-gray-700 dark:text-gray-400">
              +{task.tags.length - 3}
            </span>
          )}
        </div>
      )}

      {/* Footer — standardised order: [date | comments | checklist] | [avatar | priority] */}
      <div className="flex items-center justify-between gap-2 mt-2 pt-2 border-t border-gray-100 dark:border-gray-700">

        {/* Left group */}
        <div className="flex items-center gap-2 min-w-0">

          {/* Due date (or dim dash) */}
          <div
            className={cn(
              'flex items-center gap-1 text-[11px] font-medium shrink-0',
              task.dueDate
                ? overdue
                  ? 'text-red-500'
                  : dueSoon
                  ? 'text-yellow-500'
                  : 'text-muted'
                : 'text-muted opacity-30'
            )}
          >
            <Calendar className="h-3 w-3" />
            {task.dueDate ? formatDate(task.dueDate) : '—'}
          </div>

          {/* Comment count (or dim dash) */}
          <div className={cn(
            'flex items-center gap-1 text-[11px] shrink-0',
            task.comments.length > 0 ? 'text-muted' : 'text-muted opacity-30'
          )}>
            <MessageSquare className="h-3 w-3" />
            {task.comments.length > 0 ? task.comments.length : '—'}
          </div>

          {/* Checklist mini-bar (or dim dash) */}
          {totalItems > 0 ? (
            <div className="flex items-center gap-1.5 shrink-0">
              {/* Bar */}
              <div className="w-10 h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                <div
                  className={cn(
                    'h-full rounded-full transition-all duration-300',
                    checklistDone ? 'bg-green-500' : 'bg-brand-500'
                  )}
                  style={{ width: `${checklistPct}%` }}
                />
              </div>
              <span
                className={cn(
                  'text-[11px] font-medium tabular-nums',
                  checklistDone ? 'text-green-500' : 'text-muted'
                )}
              >
                {checkedItems}/{totalItems}
              </span>
            </div>
          ) : (
            <span className="text-[11px] text-muted opacity-30">—</span>
          )}
        </div>

        {/* Right group: assignee avatar + priority badge */}
        <div className="flex items-center gap-1.5 shrink-0">
          <Avatar user={task.assignee} size="xs" />
          <PriorityBadge priority={task.priority} />
        </div>
      </div>
    </div>
  );
}

export function TaskCardSkeleton() {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-3.5 space-y-2.5">
      <div className="skeleton h-4 w-full" />
      <div className="skeleton h-4 w-3/4" />
      <div className="flex gap-1.5">
        <div className="skeleton h-4 w-12 rounded-full" />
        <div className="skeleton h-4 w-12 rounded-full" />
      </div>
      <div className="flex justify-between pt-1">
        <div className="skeleton h-3 w-24" />
        <div className="flex gap-1">
          <div className="skeleton h-5 w-5 rounded-full" />
          <div className="skeleton h-5 w-12 rounded-full" />
        </div>
      </div>
    </div>
  );
}
