export type Priority = 'critical' | 'high' | 'medium' | 'low';
export type TaskStatus = 'backlog' | 'todo' | 'in_progress' | 'review' | 'done';
export type ProjectStatus = 'active' | 'on_hold' | 'completed' | 'planning';

export interface User {
  id: string;
  name: string;
  email: string;
  avatar: string;
  role: string;
  color: string;
}

export interface Comment {
  id: string;
  author: User;
  content: string;
  createdAt: string;
}

export interface ChecklistItem {
  id: string;
  label: string;
  done: boolean;
}

export interface ActivityEntry {
  id: string;
  user: User;
  action: string;
  target: string;
  createdAt: string;
}

export interface Task {
  id: string;
  title: string;
  description: string;
  status: TaskStatus;
  priority: Priority;
  assignee: User | null;
  tags: string[];
  dueDate: string | null;
  createdAt: string;
  updatedAt: string;
  comments: Comment[];
  checklist: ChecklistItem[];
  projectId: string;
  order: number;
}

export interface Project {
  id: string;
  name: string;
  description: string;
  owner: User;
  members: User[];
  status: ProjectStatus;
  startDate: string;
  endDate: string;
  priority: Priority;
  color: string;
  createdAt: string;
  updatedAt: string;
  activities: ActivityEntry[];
}

export type Column = {
  id: TaskStatus;
  title: string;
  color: string;
  description: string;
};

export const COLUMNS: Column[] = [
  { id: 'backlog',     title: 'Backlog',      color: '#6b7280', description: 'Ideas & future work' },
  { id: 'todo',        title: 'To Do',         color: '#3b82f6', description: 'Ready to start' },
  { id: 'in_progress', title: 'In Progress',   color: '#f59e0b', description: 'Currently being worked on' },
  { id: 'review',      title: 'Review',        color: '#8b5cf6', description: 'Awaiting review or approval' },
  { id: 'done',        title: 'Done',          color: '#10b981', description: 'Completed tasks' },
];

export const PRIORITY_CONFIG: Record<Priority, { label: string; color: string; bg: string; darkBg: string }> = {
  critical: { label: 'Critical', color: '#ef4444', bg: 'bg-red-100',    darkBg: 'dark:bg-red-900/30'    },
  high:     { label: 'High',     color: '#f97316', bg: 'bg-orange-100', darkBg: 'dark:bg-orange-900/30' },
  medium:   { label: 'Medium',   color: '#eab308', bg: 'bg-yellow-100', darkBg: 'dark:bg-yellow-900/30' },
  low:      { label: 'Low',      color: '#22c55e', bg: 'bg-green-100',  darkBg: 'dark:bg-green-900/30'  },
};
