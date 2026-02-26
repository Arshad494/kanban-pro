import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Eye, Zap, Loader2 } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { dbToProject, dbToTask, type DbProject, type DbTask } from '../lib/db';
import { selectProjectStats } from '../store/useAppStore';
import { COLUMNS, type TaskStatus, type Project, type Task } from '../types';
import { TaskCard } from '../components/TaskCard';
import { AvatarGroup } from '../components/ui/Avatar';
import { Progress } from '../components/ui/Progress';

export function SharedBoardPage() {
  const { projectId } = useParams<{ projectId: string }>();
  const [project, setProject] = useState<Project | null>(null);
  const [tasks, setTasks]     = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (!projectId) return;

    // Initial fetch
    Promise.all([
      supabase.from('projects').select('*').eq('id', projectId).single(),
      supabase.from('tasks').select('*').eq('project_id', projectId).order('order_index'),
    ]).then(([{ data: proj, error: projErr }, { data: taskData }]) => {
      if (projErr || !proj) { setNotFound(true); setLoading(false); return; }
      setProject(dbToProject(proj as DbProject));
      setTasks((taskData as DbTask[] ?? []).map(dbToTask));
      setLoading(false);
    });

    // Realtime subscription for live updates on this shared project
    const channel = supabase
      .channel(`shared-${projectId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'tasks', filter: `project_id=eq.${projectId}` },
        (payload) => {
          const { eventType } = payload;
          if (eventType === 'INSERT') {
            const task = dbToTask(payload.new as DbTask);
            setTasks((prev) => {
              if (prev.some((t) => t.id === task.id)) return prev;
              return [...prev, task];
            });
          } else if (eventType === 'UPDATE') {
            const task = dbToTask(payload.new as DbTask);
            setTasks((prev) => prev.map((t) => t.id === task.id ? task : t));
          } else if (eventType === 'DELETE') {
            const id = (payload.old as { id: string }).id;
            setTasks((prev) => prev.filter((t) => t.id !== id));
          }
        }
      )
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'projects', filter: `id=eq.${projectId}` },
        (payload) => {
          setProject(dbToProject(payload.new as DbProject));
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [projectId]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950">
        <Loader2 className="h-8 w-8 text-brand-500 animate-spin" />
      </div>
    );
  }

  if (notFound || !project) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 dark:bg-gray-950 gap-3">
        <p className="text-lg font-semibold text-gray-700 dark:text-gray-300">Project not found</p>
        <p className="text-sm text-muted">This shared link may have expired or the project doesn't exist.</p>
      </div>
    );
  }

  const stats = selectProjectStats(tasks, projectId ?? '');
  const getColumnTasks = (status: TaskStatus) => tasks.filter((t) => t.status === status);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex flex-col">
      {/* View-only banner */}
      <div className="bg-brand-600 text-white py-2 px-4 flex items-center justify-center gap-2 text-sm font-medium">
        <Eye className="h-4 w-4" />
        You are viewing a shared project — read-only access
      </div>

      {/* Topbar */}
      <header className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-brand-500 to-brand-700 flex items-center justify-center shadow-sm">
              <Zap className="h-4 w-4 text-white" />
            </div>
            <span className="font-bold text-gray-900 dark:text-white">KanbanPro</span>
          </div>
          <div className="flex items-center gap-3">
            <div
              className="h-8 w-8 rounded-lg flex items-center justify-center text-white font-bold text-sm overflow-hidden"
              style={{ backgroundColor: project.color }}
            >
              {project.name[0]}
            </div>
            <div>
              <h1 className="font-semibold text-gray-900 dark:text-white text-sm">{project.name}</h1>
              <div className="flex items-center gap-2 text-xs text-muted">
                <span>{stats.done}/{stats.total} tasks</span>
                <Progress value={stats.completion} className="w-20 inline-flex" showLabel />
              </div>
            </div>
          </div>
          <AvatarGroup users={project.members} max={5} size="sm" />
        </div>
      </header>

      {/* Board */}
      <div className="flex-1 overflow-x-auto px-6 py-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex gap-4">
            {COLUMNS.map((col) => {
              const colTasks = getColumnTasks(col.id);
              return (
                <div key={col.id} className="flex flex-col w-72 shrink-0">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: col.color }} />
                    <span className="text-sm font-semibold text-gray-800 dark:text-gray-200">{col.title}</span>
                    <span className="text-xs font-medium px-1.5 py-0.5 bg-gray-100 dark:bg-gray-800 text-muted rounded-full">
                      {colTasks.length}
                    </span>
                  </div>
                  <div className="flex-1 min-h-32 bg-gray-100/50 dark:bg-gray-800/30 rounded-xl p-2 space-y-2.5">
                    {colTasks.map((task) => (
                      <div key={task.id} className="pointer-events-none">
                        <TaskCard task={task} onClick={() => {}} />
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
