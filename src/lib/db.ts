import { supabase } from './supabase';
import type { Project, Task, User, Priority, TaskStatus, ProjectStatus } from '../types';
import { MOCK_PROJECTS, MOCK_TASKS } from '../data/mockData';

// ─── DB row shapes ────────────────────────────────────────────────────────────

export interface DbProject {
  id: string;
  name: string;
  description: string;
  owner: User;
  members: User[];
  status: string;
  start_date: string | null;
  end_date: string | null;
  priority: string;
  color: string;
  activities: unknown[];
  created_at: string;
  updated_at: string;
}

export interface DbTask {
  id: string;
  project_id: string;
  title: string;
  description: string;
  status: string;
  priority: string;
  assignee: User | null;
  tags: string[];
  due_date: string | null;
  comments: unknown[];
  checklist: unknown[];
  order_index: number;
  created_at: string;
  updated_at: string;
}

// ─── Transforms ───────────────────────────────────────────────────────────────

export function dbToProject(row: DbProject): Project {
  return {
    id:          row.id,
    name:        row.name,
    description: row.description,
    owner:       row.owner as User,
    members:     (row.members ?? []) as User[],
    status:      row.status as ProjectStatus,
    startDate:   row.start_date ?? '',
    endDate:     row.end_date   ?? '',
    priority:    row.priority as Priority,
    color:       row.color,
    activities:  (row.activities ?? []) as Project['activities'],
    createdAt:   row.created_at,
    updatedAt:   row.updated_at,
  };
}

export function projectToDb(p: Project): DbProject {
  return {
    id:          p.id,
    name:        p.name,
    description: p.description,
    owner:       p.owner,
    members:     p.members,
    status:      p.status,
    start_date:  p.startDate || null,
    end_date:    p.endDate   || null,
    priority:    p.priority,
    color:       p.color,
    activities:  p.activities,
    created_at:  p.createdAt,
    updated_at:  p.updatedAt,
  };
}

export function dbToTask(row: DbTask): Task {
  return {
    id:          row.id,
    projectId:   row.project_id,
    title:       row.title,
    description: row.description,
    status:      row.status as TaskStatus,
    priority:    row.priority as Priority,
    assignee:    (row.assignee ?? null) as User | null,
    tags:        row.tags ?? [],
    dueDate:     row.due_date ?? null,
    comments:    (row.comments ?? []) as Task['comments'],
    checklist:   (row.checklist ?? []) as Task['checklist'],
    order:       row.order_index,
    createdAt:   row.created_at,
    updatedAt:   row.updated_at,
  };
}

export function taskToDb(t: Task): DbTask {
  return {
    id:          t.id,
    project_id:  t.projectId,
    title:       t.title,
    description: t.description,
    status:      t.status,
    priority:    t.priority,
    assignee:    t.assignee,
    tags:        t.tags,
    due_date:    t.dueDate,
    comments:    t.comments,
    checklist:   t.checklist,
    order_index: t.order,
    created_at:  t.createdAt,
    updated_at:  t.updatedAt,
  };
}

// ─── CRUD ─────────────────────────────────────────────────────────────────────

export async function fetchProjects(): Promise<Project[]> {
  const { data, error } = await supabase
    .from('projects')
    .select('*')
    .order('created_at', { ascending: true });
  if (error) throw error;
  return (data as DbProject[]).map(dbToProject);
}

export async function fetchTasks(): Promise<Task[]> {
  const { data, error } = await supabase
    .from('tasks')
    .select('*')
    .order('order_index', { ascending: true });
  if (error) throw error;
  return (data as DbTask[]).map(dbToTask);
}

export async function upsertProject(project: Project): Promise<void> {
  const { error } = await supabase
    .from('projects')
    .upsert(projectToDb(project), { onConflict: 'id' });
  if (error) throw error;
}

export async function upsertTask(task: Task): Promise<void> {
  const { error } = await supabase
    .from('tasks')
    .upsert(taskToDb(task), { onConflict: 'id' });
  if (error) throw error;
}

export async function patchTask(id: string, updates: Partial<DbTask>): Promise<void> {
  const { error } = await supabase
    .from('tasks')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', id);
  if (error) throw error;
}

export async function patchProject(id: string, updates: Partial<DbProject>): Promise<void> {
  const { error } = await supabase
    .from('projects')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', id);
  if (error) throw error;
}

export async function removeTask(id: string): Promise<void> {
  const { error } = await supabase.from('tasks').delete().eq('id', id);
  if (error) throw error;
}

/** Seeds mock data if there are no projects yet (fresh account). */
export async function seedIfEmpty(): Promise<{ projects: Project[]; tasks: Task[] }> {
  const { count } = await supabase
    .from('projects')
    .select('*', { count: 'exact', head: true });

  if ((count ?? 0) > 0) {
    // Already has data — fetch and return
    const [projects, tasks] = await Promise.all([fetchProjects(), fetchTasks()]);
    return { projects, tasks };
  }

  // Seed
  await Promise.all(MOCK_PROJECTS.map(upsertProject));
  await Promise.all(MOCK_TASKS.map(upsertTask));
  return { projects: MOCK_PROJECTS, tasks: MOCK_TASKS };
}
