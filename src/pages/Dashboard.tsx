import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Plus, TrendingUp, CheckCircle2, Clock, ArrowRight, Zap,
} from 'lucide-react';
import { useAppStore, selectProjectStats } from '../store/useAppStore';
import { AvatarGroup } from '../components/ui/Avatar';
import { Progress } from '../components/ui/Progress';
import { Button } from '../components/ui/Button';
import { PriorityBadge } from '../components/PriorityBadge';
import { formatDate, formatRelative, cn } from '../utils';
import { CreateProjectModal } from '../components/CreateProjectModal';

const STATUS_STYLE: Record<string, string> = {
  active:    'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  on_hold:   'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
  completed: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  planning:  'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
};

export function Dashboard() {
  const navigate = useNavigate();
  const { projects, tasks, setActiveProject, currentUser } = useAppStore();
  const [createOpen, setCreateOpen] = useState(false);

  const totalTasks = tasks.length;
  const doneTasks  = tasks.filter((t) => t.status === 'done').length;
  const inProgress = tasks.filter((t) => t.status === 'in_progress').length;
  const activeProjects = projects.filter((p) => p.status === 'active').length;
  const overallPct = Math.round((doneTasks / totalTasks) * 100);

  const recentActivity = projects
    .flatMap((p) => p.activities)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 8);

  return (
    <div className="p-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Good morning, {currentUser?.name.split(' ')[0] ?? 'there'} 👋
          </h1>
          <p className="text-muted mt-0.5">Here's what's happening across your projects today.</p>
        </div>
        <Button icon={<Plus className="h-4 w-4" />} onClick={() => setCreateOpen(true)}>
          New Project
        </Button>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-4 gap-4 mb-8">
        {[
          { label: 'Total Tasks',     value: totalTasks,    icon: Zap,         color: 'text-brand-500',  bg: 'bg-brand-50 dark:bg-brand-900/20'   },
          { label: 'In Progress',     value: inProgress,    icon: Clock,       color: 'text-yellow-500', bg: 'bg-yellow-50 dark:bg-yellow-900/20'  },
          { label: 'Completed',       value: doneTasks,     icon: CheckCircle2,color: 'text-green-500',  bg: 'bg-green-50 dark:bg-green-900/20'    },
          { label: 'Active Projects', value: activeProjects, icon: TrendingUp,  color: 'text-purple-500', bg: 'bg-purple-50 dark:bg-purple-900/20'  },
        ].map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className="card p-5"
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm text-muted font-medium">{stat.label}</span>
              <div className={cn('h-8 w-8 rounded-lg flex items-center justify-center', stat.bg)}>
                <stat.icon className={cn('h-4 w-4', stat.color)} />
              </div>
            </div>
            <div className="text-3xl font-bold text-gray-900 dark:text-white tabular-nums">{stat.value}</div>
          </motion.div>
        ))}
      </div>

      {/* Overall progress */}
      <div className="card p-5 mb-8">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h2 className="font-semibold text-gray-900 dark:text-white">Overall Progress</h2>
            <p className="text-sm text-muted">{doneTasks} of {totalTasks} tasks completed across all projects</p>
          </div>
          <span className="text-2xl font-bold text-gray-900 dark:text-white tabular-nums">{overallPct}%</span>
        </div>
        <Progress value={overallPct} size="md" />
      </div>

      <div className="grid grid-cols-3 gap-6">
        {/* Project cards */}
        <div className="col-span-2 space-y-4">
          <h2 className="font-semibold text-gray-900 dark:text-white mb-1">Projects</h2>
          {projects.map((project, i) => {
            const stats = selectProjectStats(tasks, project.id);
            return (
              <motion.div
                key={project.id}
                initial={{ opacity: 0, x: -16 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.06 }}
                className="card p-5 hover:shadow-md transition-shadow cursor-pointer group"
                onClick={() => {
                  setActiveProject(project.id);
                  navigate(`/board/${project.id}`);
                }}
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-start gap-3 min-w-0">
                    <div
                      className="h-10 w-10 rounded-xl flex items-center justify-center text-white font-bold text-sm shrink-0"
                      style={{ backgroundColor: project.color }}
                    >
                      {project.name[0]}
                    </div>
                    <div className="min-w-0">
                      <h3 className="font-semibold text-gray-900 dark:text-white group-hover:text-brand-600 dark:group-hover:text-brand-400 transition-colors truncate">
                        {project.name}
                      </h3>
                      <p className="text-xs text-muted mt-0.5 line-clamp-1">{project.description}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0 ml-3">
                    <span className={cn('text-xs font-medium px-2 py-0.5 rounded-full capitalize', STATUS_STYLE[project.status])}>
                      {project.status.replace('_', ' ')}
                    </span>
                    <PriorityBadge priority={project.priority} compact />
                  </div>
                </div>

                <div className="mb-3">
                  <div className="flex justify-between text-xs text-muted mb-1">
                    <span>Progress</span>
                    <span className="font-medium tabular-nums">{stats.completion}%</span>
                  </div>
                  <Progress value={stats.completion} color={project.color} />
                </div>

                <div className="flex items-center justify-between">
                  <AvatarGroup users={project.members} max={4} size="xs" />
                  <div className="flex items-center gap-3 text-xs text-muted">
                    <span>{stats.total} tasks</span>
                    {project.endDate && (
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        Due {formatDate(project.endDate)}
                      </span>
                    )}
                    <ArrowRight className="h-3.5 w-3.5 text-brand-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Activity feed */}
        <div>
          <h2 className="font-semibold text-gray-900 dark:text-white mb-5">Recent Activity</h2>
          <div className="card divide-y divide-gray-100 dark:divide-gray-800">
            {recentActivity.map((entry) => (
              <div key={entry.id} className="flex gap-3 px-4 py-3">
                <div
                  className="h-6 w-6 rounded-full flex items-center justify-center text-[9px] font-bold text-white shrink-0"
                  style={{ backgroundColor: entry.user.color }}
                >
                  {entry.user.avatar}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs text-gray-700 dark:text-gray-300 leading-snug">
                    <span className="font-semibold">{entry.user.name.split(' ')[0]}</span>{' '}
                    {entry.action}{' '}
                    <span className="font-medium text-brand-600 dark:text-brand-400">{entry.target}</span>
                  </p>
                  <p className="text-[10px] text-muted mt-0.5">{formatRelative(entry.createdAt)}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <CreateProjectModal open={createOpen} onClose={() => setCreateOpen(false)} />
    </div>
  );
}
