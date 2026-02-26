import React from 'react';
import { motion } from 'framer-motion';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell,
  CartesianGrid,
} from 'recharts';
import { useAppStore, selectProjectStats } from '../store/useAppStore';
import { COLUMNS, PRIORITY_CONFIG } from '../types';
import { Avatar } from '../components/ui/Avatar';
import { Progress } from '../components/ui/Progress';

export function AnalyticsPage() {
  const { projects, tasks, users } = useAppStore();

  // Tasks by status (all projects)
  const byStatus = COLUMNS.map((col) => ({
    name: col.title,
    value: tasks.filter((t) => t.status === col.id).length,
    color: col.color,
  }));

  // Tasks by priority
  const byPriority = Object.entries(PRIORITY_CONFIG).map(([key, cfg]) => ({
    name: cfg.label,
    value: tasks.filter((t) => t.priority === key).length,
    color: cfg.color,
  }));

  // Project completion
  const projectCompletion = projects.map((p) => {
    const stats = selectProjectStats(tasks, p.id);
    return { name: p.name.split(' ').slice(0, 2).join(' '), completion: stats.completion, color: p.color };
  });

  // Team workload (tasks per user)
  const workload = users.map((u) => {
    const assigned = tasks.filter((t) => t.assignee?.id === u.id);
    const done = assigned.filter((t) => t.status === 'done').length;
    return {
      name: u.name.split(' ')[0],
      total: assigned.length,
      done,
      inProgress: assigned.filter((t) => t.status === 'in_progress').length,
      review: assigned.filter((t) => t.status === 'review').length,
      user: u,
    };
  }).filter((w) => w.total > 0);

  const totalTasks = tasks.length;
  const doneTasks = tasks.filter((t) => t.status === 'done').length;

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Analytics</h1>
        <p className="text-muted mt-0.5">Portfolio overview across all projects and team members</p>
      </div>

      {/* Top stats */}
      <div className="grid grid-cols-4 gap-4">
        {[
          { label: 'Total Tasks',       value: totalTasks },
          { label: 'Completed',         value: doneTasks },
          { label: 'In Progress',       value: tasks.filter((t) => t.status === 'in_progress').length },
          { label: 'Overdue (review)',  value: tasks.filter((t) => t.status === 'review').length },
        ].map((s, i) => (
          <motion.div
            key={s.label}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className="card p-5"
          >
            <div className="text-sm text-muted mb-1">{s.label}</div>
            <div className="text-3xl font-bold tabular-nums">{s.value}</div>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-6">
        {/* Tasks by status */}
        <div className="card p-5">
          <h2 className="font-semibold mb-4">Tasks by Status</h2>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={byStatus} barSize={36}>
              <XAxis dataKey="name" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11 }} axisLine={false} tickLine={false} width={24} />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'var(--tw-color-gray-900, #111)',
                  border: 'none',
                  borderRadius: 8,
                  fontSize: 12,
                }}
              />
              <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                {byStatus.map((entry, i) => (
                  <Cell key={i} fill={entry.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Tasks by priority */}
        <div className="card p-5">
          <h2 className="font-semibold mb-4">Tasks by Priority</h2>
          <div className="flex items-center justify-between">
            <ResponsiveContainer width="55%" height={220}>
              <PieChart>
                <Pie data={byPriority} cx="50%" cy="50%" innerRadius={55} outerRadius={85} paddingAngle={3} dataKey="value">
                  {byPriority.map((entry, i) => (
                    <Cell key={i} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ backgroundColor: '#111', border: 'none', borderRadius: 8, fontSize: 12 }}
                />
              </PieChart>
            </ResponsiveContainer>
            <div className="space-y-2 pr-2">
              {byPriority.map((item) => (
                <div key={item.name} className="flex items-center gap-2 text-xs">
                  <div className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                  <span className="text-muted">{item.name}</span>
                  <span className="font-semibold ml-auto">{item.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Project completion */}
      <div className="card p-5">
        <h2 className="font-semibold mb-5">Project Completion</h2>
        <div className="space-y-4">
          {projectCompletion.map((p) => (
            <div key={p.name} className="flex items-center gap-4">
              <span className="text-sm font-medium w-48 truncate">{p.name}</span>
              <Progress value={p.completion} color={p.color} className="flex-1" showLabel size="md" />
            </div>
          ))}
        </div>
      </div>

      {/* Team workload */}
      <div className="card p-5">
        <h2 className="font-semibold mb-5">Team Workload</h2>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={workload} barSize={24}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" strokeOpacity={0.3} />
            <XAxis dataKey="name" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 11 }} axisLine={false} tickLine={false} width={24} />
            <Tooltip contentStyle={{ backgroundColor: '#111', border: 'none', borderRadius: 8, fontSize: 12 }} />
            <Bar dataKey="done" stackId="a" fill="#10b981" radius={[0,0,0,0]} name="Done" />
            <Bar dataKey="inProgress" stackId="a" fill="#f59e0b" name="In Progress" />
            <Bar dataKey="review" stackId="a" fill="#8b5cf6" radius={[4,4,0,0]} name="Review" />
          </BarChart>
        </ResponsiveContainer>

        <div className="mt-4 grid grid-cols-2 gap-3 md:grid-cols-4">
          {workload.map((w) => (
            <div key={w.name} className="flex items-center gap-2.5 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <Avatar user={w.user} size="sm" />
              <div className="min-w-0">
                <div className="text-xs font-semibold truncate">{w.user.name.split(' ')[0]}</div>
                <div className="text-[10px] text-muted">{w.total} tasks · {w.done} done</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
