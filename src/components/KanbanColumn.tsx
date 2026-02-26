import React, { useState } from 'react';
import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, X } from 'lucide-react';
import type { Column, Task } from '../types';
import { TaskCard } from './TaskCard';
import { useAppStore } from '../store/useAppStore';
import { generateId, cn } from '../utils';
import { useToast } from './ui/Toast';

interface KanbanColumnProps {
  column: Column;
  tasks: Task[];
  projectId: string;
  onTaskClick: (id: string) => void;
}

export function KanbanColumn({ column, tasks, projectId, onTaskClick }: KanbanColumnProps) {
  const { setNodeRef, isOver } = useDroppable({ id: column.id });
  const { addTask } = useAppStore();
  const { toast } = useToast();
  const [adding, setAdding] = useState(false);
  const [newTitle, setNewTitle] = useState('');

  const handleAdd = () => {
    if (!newTitle.trim()) return;
    const task = {
      id: generateId(),
      projectId,
      title: newTitle.trim(),
      description: '',
      status: column.id,
      priority: 'medium' as const,
      assignee: null,
      tags: [],
      dueDate: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      comments: [],
      checklist: [],
      order: tasks.length,
    };
    addTask(task);
    setNewTitle('');
    setAdding(false);
    toast(`Task added to ${column.title}`, 'success');
  };

  return (
    <div className="flex flex-col w-72 shrink-0 h-full overflow-hidden">
      {/* Sticky column header */}
      <div className="sticky top-0 z-10 shrink-0 bg-gray-50 dark:bg-gray-950 pb-2">
        <div className="flex items-center justify-between px-0.5 py-1">
          <div className="flex items-center gap-2">
            {/* Color dot — present on all columns */}
            <div
              className="h-2.5 w-2.5 rounded-full shrink-0"
              style={{ backgroundColor: column.color }}
            />
            <span className="text-sm font-semibold text-gray-800 dark:text-gray-200">{column.title}</span>
            <span className="text-xs font-medium px-1.5 py-0.5 bg-gray-100 dark:bg-gray-800 text-muted rounded-full tabular-nums">
              {tasks.length}
            </span>
          </div>
          {/* + button on every column */}
          <button
            onClick={() => setAdding(true)}
            title={`Add task to ${column.title}`}
            className="p-1 rounded-md hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors"
          >
            <Plus className="h-4 w-4" />
          </button>
        </div>

        {/* Inline add form */}
        <AnimatePresence>
          {adding && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden mt-1"
            >
              <div className="bg-white dark:bg-gray-800 rounded-xl border border-brand-400 shadow-sm p-3">
                <textarea
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="Task title…"
                  rows={2}
                  autoFocus
                  className="w-full text-sm bg-transparent outline-none resize-none text-gray-900 dark:text-gray-100 placeholder-gray-400"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleAdd(); }
                    if (e.key === 'Escape') { setAdding(false); setNewTitle(''); }
                  }}
                />
                <div className="flex items-center gap-1.5 mt-2">
                  <button
                    onClick={handleAdd}
                    className="px-2.5 py-1 bg-brand-600 text-white text-xs font-semibold rounded-md hover:bg-brand-700 transition-colors"
                  >
                    Add Task
                  </button>
                  <button
                    onClick={() => { setAdding(false); setNewTitle(''); }}
                    className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Scrollable drop zone */}
      <div
        ref={setNodeRef}
        className={cn(
          'flex-1 overflow-y-auto min-h-[150px] rounded-xl p-2 space-y-2.5 transition-all duration-150',
          isOver
            ? 'bg-brand-50 dark:bg-brand-900/10 ring-2 ring-brand-400 ring-dashed'
            : 'bg-gray-100/50 dark:bg-gray-800/30'
        )}
      >
        <SortableContext items={tasks.map((t) => t.id)} strategy={verticalListSortingStrategy}>
          {tasks.map((task) => (
            <TaskCard key={task.id} task={task} onClick={() => onTaskClick(task.id)} />
          ))}
        </SortableContext>

        {tasks.length === 0 && !adding && (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <div className="h-8 w-8 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center mb-2">
              <Plus className="h-4 w-4 text-gray-400" />
            </div>
            <p className="text-xs text-muted">{column.description}</p>
          </div>
        )}
      </div>
    </div>
  );
}
