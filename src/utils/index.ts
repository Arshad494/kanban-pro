import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { format, formatDistanceToNow, isPast, isToday } from 'date-fns';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(dateStr: string | null): string {
  if (!dateStr) return '—';
  try {
    return format(new Date(dateStr), 'MMM d, yyyy');
  } catch {
    return dateStr;
  }
}

export function formatRelative(dateStr: string): string {
  try {
    return formatDistanceToNow(new Date(dateStr), { addSuffix: true });
  } catch {
    return dateStr;
  }
}

export function isDueSoon(dateStr: string | null): boolean {
  if (!dateStr) return false;
  const d = new Date(dateStr);
  const diff = d.getTime() - Date.now();
  return diff > 0 && diff < 3 * 24 * 60 * 60 * 1000; // within 3 days
}

export function isOverdue(dateStr: string | null): boolean {
  if (!dateStr) return false;
  return isPast(new Date(dateStr)) && !isToday(new Date(dateStr));
}

export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

export function getInitials(name: string): string {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

export function truncate(str: string, len = 80): string {
  return str.length > len ? str.slice(0, len) + '…' : str;
}

export const TAG_COLORS: Record<string, string> = {
  governance: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300',
  policy: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
  infrastructure: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300',
  mlops: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-300',
  dashboard: 'bg-cyan-100 text-cyan-800 dark:bg-cyan-900/30 dark:text-cyan-300',
  analytics: 'bg-teal-100 text-teal-800 dark:bg-teal-900/30 dark:text-teal-300',
  llm: 'bg-violet-100 text-violet-800 dark:bg-violet-900/30 dark:text-violet-300',
  integration: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
  nlp: 'bg-pink-100 text-pink-800 dark:bg-pink-900/30 dark:text-pink-300',
  compliance: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300',
  security: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300',
  testing: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300',
  uat: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300',
  data: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300',
  migration: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300',
  finance: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
  api: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
  iot: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300',
  architecture: 'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-300',
  ml: 'bg-violet-100 text-violet-800 dark:bg-violet-900/30 dark:text-violet-300',
  research: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300',
  poc: 'bg-lime-100 text-lime-800 dark:bg-lime-900/30 dark:text-lime-300',
  training: 'bg-sky-100 text-sky-800 dark:bg-sky-900/30 dark:text-sky-300',
  enablement: 'bg-sky-100 text-sky-800 dark:bg-sky-900/30 dark:text-sky-300',
  database: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300',
  chatbot: 'bg-fuchsia-100 text-fuchsia-800 dark:bg-fuchsia-900/30 dark:text-fuchsia-300',
  ux: 'bg-pink-100 text-pink-800 dark:bg-pink-900/30 dark:text-pink-300',
  routing: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-300',
  automation: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300',
  sentiment: 'bg-rose-100 text-rose-800 dark:bg-rose-900/30 dark:text-rose-300',
  pipeline: 'bg-cyan-100 text-cyan-800 dark:bg-cyan-900/30 dark:text-cyan-300',
  oee: 'bg-teal-100 text-teal-800 dark:bg-teal-900/30 dark:text-teal-300',
  requirements: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300',
  predictive: 'bg-violet-100 text-violet-800 dark:bg-violet-900/30 dark:text-violet-300',
  planning: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
  decommission: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300',
  bert: 'bg-violet-100 text-violet-800 dark:bg-violet-900/30 dark:text-violet-300',
  'data-lake': 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300',
  'ai-safety': 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300',
};

export function getTagColor(tag: string): string {
  return TAG_COLORS[tag] ?? 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300';
}
