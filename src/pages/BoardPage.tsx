import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  DndContext,
  type DragEndEvent,
  type DragOverEvent,
  type DragStartEvent,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  closestCorners,
} from '@dnd-kit/core';
import { motion } from 'framer-motion';
import { Share2, Search, Filter, X, Users, Flag } from 'lucide-react';
import { useAppStore, selectFilteredTasks, selectProjectStats } from '../store/useAppStore';
import { COLUMNS, type TaskStatus } from '../types';
import { KanbanColumn } from '../components/KanbanColumn';
import { TaskCard } from '../components/TaskCard';
import { TaskDetailPanel } from '../components/TaskDetailPanel';
import { AvatarGroup } from '../components/ui/Avatar';
import { Button } from '../components/ui/Button';
import { useToast } from '../components/ui/Toast';
import { ShareModal } from '../components/ShareModal';

export function BoardPage() {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();
  const {
    projects, tasks, setActiveProject, setActiveTask, activeTaskId,
    moveTask, updateTask, searchQuery, setSearchQuery,
    filterAssignee, setFilterAssignee,
    filterPriority, setFilterPriority,
  } = useAppStore();
  const { toast } = useToast();

  const project = projects.find((p) => p.id === projectId);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [shareOpen, setShareOpen] = useState(false);
  const [filterOpen, setFilterOpen] = useState(false);

  useEffect(() => {
    if (projectId) setActiveProject(projectId);
  }, [projectId]);

  useEffect(() => {
    if (!project) navigate('/');
  }, [project]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
  );

  const filteredTasks = selectFilteredTasks(
    tasks, projectId ?? '', searchQuery, filterAssignee, filterPriority
  );

  const getColumnTasks = (status: TaskStatus) =>
    filteredTasks.filter((t) => t.status === status);

  const activeTask = tasks.find((t) => t.id === activeId);

  const onDragStart = ({ active }: DragStartEvent) => {
    setActiveId(active.id as string);
  };

  const onDragOver = ({ active, over }: DragOverEvent) => {
    if (!over) return;
    const activeTaskItem = tasks.find((t) => t.id === active.id);
    if (!activeTaskItem) return;
    const overId = over.id as string;
    const overColumn = COLUMNS.find((c) => c.id === overId);
    if (overColumn && activeTaskItem.status !== overColumn.id) {
      updateTask(active.id as string, { status: overColumn.id as TaskStatus });
    }
  };

  const onDragEnd = ({ active, over }: DragEndEvent) => {
    setActiveId(null);
    if (!over) return;
    const activeTaskItem = tasks.find((t) => t.id === active.id);
    if (!activeTaskItem) return;
    const overId = over.id as string;
    const overColumn = COLUMNS.find((c) => c.id === overId);
    const overTask = tasks.find((t) => t.id === overId);
    if (overColumn) {
      moveTask(active.id as string, overColumn.id, 0);
      toast(`Moved to ${overColumn.title}`, 'success');
    } else if (overTask && overTask.status !== activeTaskItem.status) {
      moveTask(active.id as string, overTask.status, 0);
    }
  };

  const stats = selectProjectStats(tasks, projectId ?? '');
  const hasActiveFilter = searchQuery || filterAssignee || filterPriority;

  if (!project) return null;

  return (
    <div className="flex flex-col h-screen overflow-hidden">
      {/* Header */}
      <div className="shrink-0 px-6 py-4 border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            {/* Project initial — overflow-hidden prevents orphan letter bleed */}
            <div
              className="h-9 w-9 rounded-lg flex items-center justify-center text-white font-bold text-sm shrink-0 overflow-hidden select-none"
              style={{ backgroundColor: project.color }}
            >
              {project.name[0]}
            </div>
            <div className="min-w-0">
              <h1 className="text-lg font-bold text-gray-900 dark:text-white truncate">{project.name}</h1>
              {/* Consolidated single-node subtitle — no separate span gaps */}
              <div className="text-xs text-muted mt-0.5">
                {`${stats.done} / ${stats.total} tasks done · ${stats.completion}%`}
              </div>
              {/* Thin milestone-style progress bar */}
              <div className="w-40 mt-1.5 h-1 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{ width: `${stats.completion}%`, backgroundColor: project.color }}
                />
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {/* Avatar cluster — sm size for readable initials, with member tooltips */}
            <AvatarGroup users={project.members} max={4} size="sm" />

            {/* Vertical separator before search */}
            <div className="w-px h-6 bg-gray-200 dark:bg-gray-700 mx-1" />

            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400 pointer-events-none" />
              <input
                type="text"
                placeholder="Search tasks…"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="h-8 pl-8 pr-3 w-48 text-sm bg-gray-100 dark:bg-gray-800 rounded-lg border-0 outline-none focus:ring-2 focus:ring-brand-400 placeholder-gray-400"
              />
              {searchQuery && (
                <button onClick={() => setSearchQuery('')} className="absolute right-2 top-1/2 -translate-y-1/2">
                  <X className="h-3.5 w-3.5 text-gray-400 hover:text-gray-600" />
                </button>
              )}
            </div>

            {/* Filter */}
            <div className="relative">
              <Button
                variant={hasActiveFilter ? 'primary' : 'outline'}
                size="sm"
                icon={<Filter className="h-3.5 w-3.5" />}
                onClick={() => setFilterOpen((p) => !p)}
              >
                Filter
              </Button>

              {filterOpen && (
                <motion.div
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="absolute right-0 top-10 z-30 w-64 card shadow-xl p-4 space-y-3"
                >
                  <div>
                    <label className="text-xs font-semibold text-muted mb-1.5 flex items-center gap-1">
                      <Users className="h-3 w-3" /> Assignee
                    </label>
                    <select
                      value={filterAssignee ?? ''}
                      onChange={(e) => setFilterAssignee(e.target.value || null)}
                      className="input-base"
                    >
                      <option value="">All members</option>
                      {project.members.map((u) => (
                        <option key={u.id} value={u.id}>{u.name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-muted mb-1.5 flex items-center gap-1">
                      <Flag className="h-3 w-3" /> Priority
                    </label>
                    <select
                      value={filterPriority ?? ''}
                      onChange={(e) => setFilterPriority(e.target.value || null)}
                      className="input-base"
                    >
                      <option value="">All priorities</option>
                      <option value="critical">Critical</option>
                      <option value="high">High</option>
                      <option value="medium">Medium</option>
                      <option value="low">Low</option>
                    </select>
                  </div>
                  {hasActiveFilter && (
                    <button
                      onClick={() => { setFilterAssignee(null); setFilterPriority(null); }}
                      className="text-xs text-red-500 hover:text-red-700 font-medium"
                    >
                      Clear filters
                    </button>
                  )}
                </motion.div>
              )}
            </div>

            <Button
              variant="outline"
              size="sm"
              icon={<Share2 className="h-3.5 w-3.5" />}
              onClick={() => setShareOpen(true)}
            >
              Share
            </Button>
          </div>
        </div>
      </div>

      {/* Board */}
      <div className="flex-1 overflow-x-auto overflow-y-hidden px-6 py-5">
        <DndContext
          sensors={sensors}
          collisionDetection={closestCorners}
          onDragStart={onDragStart}
          onDragOver={onDragOver}
          onDragEnd={onDragEnd}
        >
          <div className="flex gap-4 h-full pb-4">
            {COLUMNS.map((col) => (
              <KanbanColumn
                key={col.id}
                column={col}
                tasks={getColumnTasks(col.id)}
                projectId={projectId ?? ''}
                onTaskClick={(id) => setActiveTask(id)}
              />
            ))}
          </div>

          <DragOverlay>
            {activeTask && (
              <div className="rotate-2 opacity-95">
                <TaskCard task={activeTask} onClick={() => {}} />
              </div>
            )}
          </DragOverlay>
        </DndContext>
      </div>

      <TaskDetailPanel taskId={activeTaskId} onClose={() => setActiveTask(null)} />
      <ShareModal open={shareOpen} onClose={() => setShareOpen(false)} projectId={projectId ?? ''} />
    </div>
  );
}
