import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Modal } from './ui/Modal';
import { Button } from './ui/Button';
import { useAppStore } from '../store/useAppStore';
import { useToast } from './ui/Toast';
import { generateId } from '../utils';
import type { Priority, ProjectStatus } from '../types';

const COLORS = [
  '#5a67f2', '#10b981', '#f59e0b', '#8b5cf6',
  '#ef4444', '#06b6d4', '#ec4899', '#f97316',
];

interface Props {
  open: boolean;
  onClose: () => void;
}

export function CreateProjectModal({ open, onClose }: Props) {
  const navigate = useNavigate();
  const { users, addProject, setActiveProject } = useAppStore();
  const { toast } = useToast();

  const [form, setForm] = useState({
    name: '',
    description: '',
    ownerId: users[0]?.id ?? '',
    startDate: new Date().toISOString().slice(0, 10),
    endDate: '',
    priority: 'medium' as Priority,
    color: COLORS[0],
    memberIds: [users[0]?.id ?? ''],
  });

  const set = (field: string, value: any) => setForm((f) => ({ ...f, [field]: value }));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) return;

    const owner = users.find((u) => u.id === form.ownerId) ?? users[0];
    const members = users.filter((u) => form.memberIds.includes(u.id));

    const project = {
      id: generateId(),
      name: form.name.trim(),
      description: form.description.trim(),
      owner,
      members,
      status: 'active' as ProjectStatus,
      priority: form.priority,
      color: form.color,
      startDate: form.startDate,
      endDate: form.endDate || '',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      activities: [],
    };

    addProject(project);
    setActiveProject(project.id);
    toast(`Project "${project.name}" created!`, 'success');
    onClose();
    navigate(`/board/${project.id}`);
  };

  const toggleMember = (id: string) => {
    set(
      'memberIds',
      form.memberIds.includes(id)
        ? form.memberIds.filter((m) => m !== id)
        : [...form.memberIds, id]
    );
  };

  return (
    <Modal open={open} onClose={onClose} title="New Project" size="lg">
      <form onSubmit={handleSubmit} className="px-6 py-5 space-y-5">
        {/* Name */}
        <Field label="Project Name *">
          <input
            type="text"
            value={form.name}
            onChange={(e) => set('name', e.target.value)}
            placeholder="e.g. AI Transformation Program"
            className="input-base"
            autoFocus
            required
          />
        </Field>

        {/* Description */}
        <Field label="Description">
          <textarea
            value={form.description}
            onChange={(e) => set('description', e.target.value)}
            placeholder="What is this project about?"
            rows={3}
            className="input-base resize-none"
          />
        </Field>

        {/* Owner + Priority */}
        <div className="grid grid-cols-2 gap-4">
          <Field label="Project Owner">
            <select value={form.ownerId} onChange={(e) => set('ownerId', e.target.value)} className="input-base">
              {users.map((u) => (
                <option key={u.id} value={u.id}>{u.name}</option>
              ))}
            </select>
          </Field>

          <Field label="Priority">
            <select value={form.priority} onChange={(e) => set('priority', e.target.value as Priority)} className="input-base">
              <option value="critical">Critical</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>
          </Field>
        </div>

        {/* Dates */}
        <div className="grid grid-cols-2 gap-4">
          <Field label="Start Date">
            <input type="date" value={form.startDate} onChange={(e) => set('startDate', e.target.value)} className="input-base" />
          </Field>
          <Field label="End Date">
            <input type="date" value={form.endDate} onChange={(e) => set('endDate', e.target.value)} className="input-base" />
          </Field>
        </div>

        {/* Color */}
        <Field label="Project Color">
          <div className="flex gap-2">
            {COLORS.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => set('color', c)}
                className="h-7 w-7 rounded-full ring-2 ring-offset-2 transition-transform hover:scale-110"
                style={{
                  backgroundColor: c,
                  outlineColor: form.color === c ? c : 'transparent',
                  outline: form.color === c ? `2px solid ${c}` : '2px solid transparent',
                  outlineOffset: '2px',
                }}
              />
            ))}
          </div>
        </Field>

        {/* Team Members */}
        <Field label="Team Members">
          <div className="flex flex-wrap gap-2">
            {users.map((u) => {
              const selected = form.memberIds.includes(u.id);
              return (
                <button
                  key={u.id}
                  type="button"
                  onClick={() => toggleMember(u.id)}
                  className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-full text-xs font-medium border transition-all ${
                    selected
                      ? 'border-brand-500 bg-brand-50 dark:bg-brand-900/30 text-brand-700 dark:text-brand-300'
                      : 'border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:border-gray-300 dark:hover:border-gray-600'
                  }`}
                >
                  <div
                    className="h-4 w-4 rounded-full flex items-center justify-center text-[9px] font-bold text-white"
                    style={{ backgroundColor: u.color }}
                  >
                    {u.avatar}
                  </div>
                  {u.name.split(' ')[0]}
                </button>
              );
            })}
          </div>
        </Field>

        {/* Submit */}
        <div className="flex justify-end gap-2 pt-2 border-t border-gray-100 dark:border-gray-800">
          <Button variant="secondary" type="button" onClick={onClose}>Cancel</Button>
          <Button type="submit" disabled={!form.name.trim()}>Create Project</Button>
        </div>
      </form>
    </Modal>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1.5">{label}</label>
      {children}
    </div>
  );
}
