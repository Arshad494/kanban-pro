import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X, Calendar, Tag, User as UserIcon, Flag, CheckSquare,
  MessageSquare, Clock, Trash2, Edit3, Send,
} from 'lucide-react';
import { type TaskStatus, COLUMNS, PRIORITY_CONFIG } from '../types';
import { useAppStore } from '../store/useAppStore';
import { useToast } from './ui/Toast';
import { Avatar } from './ui/Avatar';
import { PriorityBadge } from './PriorityBadge';
import { Button } from './ui/Button';
import { cn, formatRelative, generateId, getTagColor } from '../utils';

interface TaskDetailPanelProps {
  taskId: string | null;
  onClose: () => void;
}

export function TaskDetailPanel({ taskId, onClose }: TaskDetailPanelProps) {
  const { tasks, users, updateTask, deleteTask, setActiveTask } = useAppStore();
  const { toast } = useToast();
  const [comment, setComment] = useState('');
  const [editingTitle, setEditingTitle] = useState(false);
  const [titleDraft, setTitleDraft] = useState('');

  const task = tasks.find((t) => t.id === taskId) ?? null;

  const handleClose = () => {
    setActiveTask(null);
    onClose();
  };

  const handleStatusChange = (status: TaskStatus) => {
    if (!task) return;
    updateTask(task.id, { status });
    toast(`Moved to ${COLUMNS.find((c) => c.id === status)?.title}`, 'success');
  };

  const handleToggleChecklist = (itemId: string) => {
    if (!task) return;
    const updated = task.checklist.map((c) =>
      c.id === itemId ? { ...c, done: !c.done } : c
    );
    updateTask(task.id, { checklist: updated });
  };

  const handleAddComment = () => {
    if (!task || !comment.trim()) return;
    const newComment = {
      id: generateId(),
      author: users[0],
      content: comment.trim(),
      createdAt: new Date().toISOString(),
    };
    updateTask(task.id, { comments: [...task.comments, newComment] });
    setComment('');
    toast('Comment added', 'success');
  };

  const handleDelete = () => {
    if (!task) return;
    if (confirm(`Delete "${task.title}"?`)) {
      deleteTask(task.id);
      handleClose();
      toast('Task deleted', 'info');
    }
  };

  const handleTitleSave = () => {
    if (!task || !titleDraft.trim()) return;
    updateTask(task.id, { title: titleDraft.trim() });
    setEditingTitle(false);
    toast('Title updated', 'success');
  };

  const checkedCount = task?.checklist.filter((c) => c.done).length ?? 0;
  const checklistPct = task && task.checklist.length > 0
    ? Math.round((checkedCount / task.checklist.length) * 100)
    : 0;

  return (
    <AnimatePresence>
      {taskId && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 bg-black/40 backdrop-blur-[2px]"
            onClick={handleClose}
          />

          {/* Panel */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 350 }}
            className="fixed top-0 right-0 h-full w-[520px] max-w-full z-50 bg-white dark:bg-gray-900 shadow-2xl flex flex-col border-l border-gray-200 dark:border-gray-800"
          >
            {task ? (
              <>
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-gray-800">
                  <div className="flex items-center gap-2">
                    <PriorityBadge priority={task.priority} />
                    <span className="text-xs text-muted font-mono">#{task.id.slice(0, 6)}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Button variant="ghost" size="xs" icon={<Trash2 className="h-3.5 w-3.5" />} onClick={handleDelete} className="text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20">
                      Delete
                    </Button>
                    <button
                      onClick={handleClose}
                      className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500 transition-colors"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                <div className="flex-1 overflow-y-auto">
                  <div className="px-6 py-5 space-y-6">
                    {/* Title */}
                    <div>
                      {editingTitle ? (
                        <div className="space-y-2">
                          <textarea
                            value={titleDraft}
                            onChange={(e) => setTitleDraft(e.target.value)}
                            className="w-full text-lg font-bold bg-gray-50 dark:bg-gray-800 rounded-lg px-3 py-2 border border-brand-300 dark:border-brand-600 outline-none resize-none"
                            rows={2}
                            autoFocus
                          />
                          <div className="flex gap-2">
                            <Button size="xs" onClick={handleTitleSave}>Save</Button>
                            <Button size="xs" variant="ghost" onClick={() => setEditingTitle(false)}>Cancel</Button>
                          </div>
                        </div>
                      ) : (
                        <div className="group flex items-start gap-2">
                          <h1 className="flex-1 text-xl font-bold text-gray-900 dark:text-gray-100 leading-snug">
                            {task.title}
                          </h1>
                          <button
                            onClick={() => { setEditingTitle(true); setTitleDraft(task.title); }}
                            className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-400 transition-all"
                          >
                            <Edit3 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      )}
                    </div>

                    {/* Meta grid */}
                    <div className="grid grid-cols-2 gap-4">
                      <MetaField label="Status" icon={<Flag className="h-3.5 w-3.5" />}>
                        <select
                          value={task.status}
                          onChange={(e) => handleStatusChange(e.target.value as TaskStatus)}
                          className="w-full text-sm bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-2 py-1.5 outline-none focus:ring-2 focus:ring-brand-400"
                        >
                          {COLUMNS.map((col) => (
                            <option key={col.id} value={col.id}>{col.title}</option>
                          ))}
                        </select>
                      </MetaField>

                      <MetaField label="Assignee" icon={<UserIcon className="h-3.5 w-3.5" />}>
                        <select
                          value={task.assignee?.id ?? ''}
                          onChange={(e) => {
                            const u = users.find((u) => u.id === e.target.value) ?? null;
                            updateTask(task.id, { assignee: u });
                          }}
                          className="w-full text-sm bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-2 py-1.5 outline-none focus:ring-2 focus:ring-brand-400"
                        >
                          <option value="">Unassigned</option>
                          {users.map((u) => (
                            <option key={u.id} value={u.id}>{u.name}</option>
                          ))}
                        </select>
                      </MetaField>

                      <MetaField label="Priority" icon={<Flag className="h-3.5 w-3.5" />}>
                        <select
                          value={task.priority}
                          onChange={(e) => updateTask(task.id, { priority: e.target.value as any })}
                          className="w-full text-sm bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-2 py-1.5 outline-none focus:ring-2 focus:ring-brand-400"
                        >
                          {Object.entries(PRIORITY_CONFIG).map(([k, v]) => (
                            <option key={k} value={k}>{v.label}</option>
                          ))}
                        </select>
                      </MetaField>

                      <MetaField label="Due Date" icon={<Calendar className="h-3.5 w-3.5" />}>
                        <input
                          type="date"
                          value={task.dueDate ?? ''}
                          onChange={(e) => updateTask(task.id, { dueDate: e.target.value || null })}
                          className="w-full text-sm bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-2 py-1.5 outline-none focus:ring-2 focus:ring-brand-400"
                        />
                      </MetaField>
                    </div>

                    {/* Description */}
                    {task.description && (
                      <div>
                        <h3 className="text-xs font-semibold text-muted uppercase tracking-wider mb-2">Description</h3>
                        <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
                          {task.description}
                        </p>
                      </div>
                    )}

                    {/* Tags */}
                    {task.tags.length > 0 && (
                      <div>
                        <h3 className="text-xs font-semibold text-muted uppercase tracking-wider mb-2 flex items-center gap-1.5">
                          <Tag className="h-3.5 w-3.5" /> Tags
                        </h3>
                        <div className="flex flex-wrap gap-1.5">
                          {task.tags.map((tag) => (
                            <span
                              key={tag}
                              className={cn('text-xs px-2 py-0.5 rounded-full font-medium', getTagColor(tag))}
                            >
                              {tag}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Checklist */}
                    {task.checklist.length > 0 && (
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <h3 className="text-xs font-semibold text-muted uppercase tracking-wider flex items-center gap-1.5">
                            <CheckSquare className="h-3.5 w-3.5" /> Checklist
                          </h3>
                          <span className="text-xs text-muted">{checklistPct}%</span>
                        </div>
                        <div className="w-full h-1.5 bg-gray-100 dark:bg-gray-800 rounded-full mb-3 overflow-hidden">
                          <div
                            className="h-full bg-brand-500 rounded-full transition-all duration-300"
                            style={{ width: `${checklistPct}%` }}
                          />
                        </div>
                        <div className="space-y-2">
                          {task.checklist.map((item) => (
                            <label key={item.id} className="flex items-start gap-2.5 cursor-pointer group">
                              <div
                                onClick={() => handleToggleChecklist(item.id)}
                                className={cn(
                                  'mt-0.5 h-4 w-4 shrink-0 rounded border-2 flex items-center justify-center transition-all',
                                  item.done
                                    ? 'bg-brand-600 border-brand-600'
                                    : 'border-gray-300 dark:border-gray-600 hover:border-brand-400'
                                )}
                              >
                                {item.done && (
                                  <svg className="h-2.5 w-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                  </svg>
                                )}
                              </div>
                              <span
                                className={cn(
                                  'text-sm',
                                  item.done
                                    ? 'line-through text-muted'
                                    : 'text-gray-800 dark:text-gray-200'
                                )}
                              >
                                {item.label}
                              </span>
                            </label>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Comments */}
                    <div>
                      <h3 className="text-xs font-semibold text-muted uppercase tracking-wider mb-3 flex items-center gap-1.5">
                        <MessageSquare className="h-3.5 w-3.5" /> Comments ({task.comments.length})
                      </h3>
                      <div className="space-y-4">
                        {task.comments.map((c) => (
                          <div key={c.id} className="flex gap-3">
                            <Avatar user={c.author} size="sm" />
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                <span className="text-xs font-semibold text-gray-900 dark:text-gray-100">
                                  {c.author.name}
                                </span>
                                <span className="text-[10px] text-muted flex items-center gap-1">
                                  <Clock className="h-2.5 w-2.5" />
                                  {formatRelative(c.createdAt)}
                                </span>
                              </div>
                              <p className="text-sm text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-gray-800 rounded-lg px-3 py-2">
                                {c.content}
                              </p>
                            </div>
                          </div>
                        ))}

                        {/* Add comment */}
                        <div className="flex gap-3">
                          <Avatar user={users[0]} size="sm" />
                          <div className="flex-1">
                            <textarea
                              value={comment}
                              onChange={(e) => setComment(e.target.value)}
                              placeholder="Write a comment…"
                              rows={2}
                              className="w-full text-sm bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-brand-400 resize-none"
                              onKeyDown={(e) => {
                                if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) handleAddComment();
                              }}
                            />
                            <Button
                              size="xs"
                              className="mt-1.5"
                              icon={<Send className="h-3 w-3" />}
                              onClick={handleAddComment}
                              disabled={!comment.trim()}
                            >
                              Comment
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Activity timeline */}
                    <div>
                      <h3 className="text-xs font-semibold text-muted uppercase tracking-wider mb-2 flex items-center gap-1.5">
                        <Clock className="h-3.5 w-3.5" /> Activity
                      </h3>
                      <div className="space-y-2">
                        {[
                          { text: `Created ${formatRelative(task.createdAt)}`, time: task.createdAt },
                          { text: `Last updated ${formatRelative(task.updatedAt)}`, time: task.updatedAt },
                        ].map((entry, i) => (
                          <div key={i} className="flex items-center gap-2 text-xs text-muted">
                            <div className="h-1.5 w-1.5 rounded-full bg-gray-300 dark:bg-gray-600" />
                            {entry.text}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center text-muted">
                <span className="text-sm">Loading…</span>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

function MetaField({ label, icon, children }: { label: string; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <div>
      <label className="flex items-center gap-1 text-[11px] font-semibold text-muted uppercase tracking-wider mb-1.5">
        {icon}
        {label}
      </label>
      {children}
    </div>
  );
}
