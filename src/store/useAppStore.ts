import { create } from 'zustand';
import type { RealtimePostgresChangesPayload } from '@supabase/supabase-js';
import type { Project, Task, TaskStatus, User } from '../types';
import { MOCK_USERS } from '../data/mockUsers';
import {
  fetchProjects, fetchTasks, seedIfEmpty,
  upsertProject, upsertTask, patchTask, patchProject, removeTask,
  dbToProject, dbToTask, projectToDb, taskToDb,
  type DbProject, type DbTask,
} from '../lib/db';

// ─── Offline sync queue ───────────────────────────────────────────────────────

type PendingSync =
  | { type: 'upsertProject'; data: DbProject }
  | { type: 'upsertTask';    data: DbTask }
  | { type: 'patchTask';     id: string; updates: Partial<DbTask> }
  | { type: 'patchProject';  id: string; updates: Partial<DbProject> }
  | { type: 'deleteTask';    id: string };

async function executePendingSync(sync: PendingSync): Promise<void> {
  switch (sync.type) {
    case 'upsertProject': await upsertProject(dbToProject(sync.data)); break;
    case 'upsertTask':    await upsertTask(dbToTask(sync.data)); break;
    case 'patchTask':     await patchTask(sync.id, sync.updates); break;
    case 'patchProject':  await patchProject(sync.id, sync.updates); break;
    case 'deleteTask':    await removeTask(sync.id); break;
  }
}

// ─── Store shape ──────────────────────────────────────────────────────────────

interface AppState {
  projects:      Project[];
  tasks:         Task[];
  users:         User[];
  activeProjectId: string | null;
  activeTaskId:    string | null;
  theme:           'light' | 'dark';
  searchQuery:     string;
  filterAssignee:  string | null;
  filterPriority:  string | null;

  // Auth / sync state
  currentUser:    User | null;
  isInitialized:  boolean;
  isOnline:       boolean;
  pendingSyncs:   PendingSync[];

  // ── Actions ─────────────────────────────────────────────────────────────────
  setCurrentUser: (user: User | null) => void;
  initialize:     () => Promise<void>;
  setOnline:      (online: boolean) => void;
  flushPendingSyncs: () => Promise<void>;
  handleRealtimeEvent: (
    table: 'projects' | 'tasks',
    payload: RealtimePostgresChangesPayload<Record<string, unknown>>
  ) => void;

  setActiveProject:  (id: string | null) => void;
  setActiveTask:     (id: string | null) => void;
  toggleTheme:       () => void;
  setSearchQuery:    (q: string) => void;
  setFilterAssignee: (id: string | null) => void;
  setFilterPriority: (p: string | null) => void;

  addProject:    (project: Project) => void;
  updateProject: (id: string, updates: Partial<Project>) => void;

  addTask:    (task: Task) => void;
  updateTask: (id: string, updates: Partial<Task>) => void;
  deleteTask: (id: string) => void;
  moveTask:   (taskId: string, newStatus: TaskStatus, newOrder: number) => void;
  reorderTask:(taskId: string, targetTaskId: string, status: TaskStatus) => void;
}

// ─── Store ────────────────────────────────────────────────────────────────────

export const useAppStore = create<AppState>()((set, get) => ({
  projects:        [],
  tasks:           [],
  users:           MOCK_USERS,
  activeProjectId: null,
  activeTaskId:    null,
  theme:           (localStorage.getItem('kanban-theme') as 'light' | 'dark') ?? 'dark',
  searchQuery:     '',
  filterAssignee:  null,
  filterPriority:  null,

  currentUser:   null,
  isInitialized: false,
  isOnline:      navigator.onLine,
  pendingSyncs:  [],

  // ── Auth ────────────────────────────────────────────────────────────────────

  setCurrentUser: (user) => {
    if (user === null) {
      // Signing out — clear project data and flip back to authenticated-view-ready
      // Keep isInitialized true so the loading spinner doesn't re-appear
      set({ currentUser: null, projects: [], tasks: [], activeProjectId: null, activeTaskId: null });
    } else {
      // Signing in — mark as NOT initialized so the auth gate shows the spinner
      // while initialize() fetches the user's data from Supabase
      set({ currentUser: user, isInitialized: false });
    }
  },

  initialize: async () => {
    const { currentUser } = get();
    try {
      if (currentUser) {
        // Authenticated: fetch from Supabase, seed mock data if the DB is empty
        const { projects, tasks } = await seedIfEmpty();
        const theme = (localStorage.getItem('kanban-theme') as 'light' | 'dark') ?? 'dark';
        document.documentElement.classList.toggle('dark', theme === 'dark');
        set({
          projects,
          tasks,
          activeProjectId: projects[0]?.id ?? null,
          isInitialized: true,
          theme,
        });
      } else {
        // No session — unblock the UI so the auth gate can show AuthPage
        set({ isInitialized: true });
      }
    } catch {
      // Supabase unreachable — still unblock the UI
      set({ isInitialized: true });
    }
  },

  // ── Online / offline ────────────────────────────────────────────────────────

  setOnline: (isOnline) => set({ isOnline }),

  flushPendingSyncs: async () => {
    const { pendingSyncs } = get();
    if (pendingSyncs.length === 0) return;

    const remaining: PendingSync[] = [];
    for (const sync of pendingSyncs) {
      try {
        await executePendingSync(sync);
      } catch {
        remaining.push(sync);
      }
    }
    set({ pendingSyncs: remaining });
  },

  // ── Realtime ────────────────────────────────────────────────────────────────

  handleRealtimeEvent: (table, payload) => {
    const { eventType } = payload;

    if (table === 'projects') {
      set((s) => {
        if (eventType === 'INSERT') {
          const row = payload.new as unknown as DbProject;
          const project = dbToProject(row);
          const exists = s.projects.some((p) => p.id === project.id);
          return exists ? s : { projects: [...s.projects, project] };
        }
        if (eventType === 'UPDATE') {
          const row = payload.new as unknown as DbProject;
          const updated = dbToProject(row);
          return { projects: s.projects.map((p) => p.id === updated.id ? updated : p) };
        }
        if (eventType === 'DELETE') {
          const id = (payload.old as unknown as { id: string }).id;
          return { projects: s.projects.filter((p) => p.id !== id) };
        }
        return s;
      });
    }

    if (table === 'tasks') {
      set((s) => {
        if (eventType === 'INSERT') {
          const row = payload.new as unknown as DbTask;
          const task = dbToTask(row);
          const exists = s.tasks.some((t) => t.id === task.id);
          return exists ? s : { tasks: [...s.tasks, task] };
        }
        if (eventType === 'UPDATE') {
          const row = payload.new as unknown as DbTask;
          const updated = dbToTask(row);
          return { tasks: s.tasks.map((t) => t.id === updated.id ? updated : t) };
        }
        if (eventType === 'DELETE') {
          const id = (payload.old as unknown as { id: string }).id;
          return { tasks: s.tasks.filter((t) => t.id !== id) };
        }
        return s;
      });
    }
  },

  // ── UI state ────────────────────────────────────────────────────────────────

  setActiveProject: (id) => set({ activeProjectId: id, activeTaskId: null }),
  setActiveTask:    (id) => set({ activeTaskId: id }),

  toggleTheme: () =>
    set((s) => {
      const next = s.theme === 'dark' ? 'light' : 'dark';
      document.documentElement.classList.toggle('dark', next === 'dark');
      localStorage.setItem('kanban-theme', next);
      return { theme: next };
    }),

  setSearchQuery:    (searchQuery)    => set({ searchQuery }),
  setFilterAssignee: (filterAssignee) => set({ filterAssignee }),
  setFilterPriority: (filterPriority) => set({ filterPriority }),

  // ── Project mutations ────────────────────────────────────────────────────────

  addProject: (project) => {
    set((s) => ({ projects: [...s.projects, project] }));
    const { isOnline } = get();
    const db = projectToDb(project);
    if (!isOnline) {
      set((s) => ({ pendingSyncs: [...s.pendingSyncs, { type: 'upsertProject', data: db }] }));
      return;
    }
    upsertProject(project).catch(() => {
      set((s) => ({ pendingSyncs: [...s.pendingSyncs, { type: 'upsertProject', data: db }] }));
    });
  },

  updateProject: (id, updates) => {
    set((s) => ({
      projects: s.projects.map((p) =>
        p.id === id ? { ...p, ...updates, updatedAt: new Date().toISOString() } : p
      ),
    }));
    const { isOnline } = get();
    const project = get().projects.find((p) => p.id === id);
    if (!project) return;
    const dbUpdates: Partial<DbProject> = {};
    if (updates.name)        dbUpdates.name        = updates.name;
    if (updates.description) dbUpdates.description = updates.description;
    if (updates.status)      dbUpdates.status      = updates.status;
    if (updates.priority)    dbUpdates.priority    = updates.priority;
    if (updates.color)       dbUpdates.color       = updates.color;
    if (updates.members)     dbUpdates.members     = updates.members;
    if (updates.activities)  dbUpdates.activities  = updates.activities;
    if (!isOnline) {
      set((s) => ({ pendingSyncs: [...s.pendingSyncs, { type: 'patchProject', id, updates: dbUpdates }] }));
      return;
    }
    patchProject(id, dbUpdates).catch(() => {
      set((s) => ({ pendingSyncs: [...s.pendingSyncs, { type: 'patchProject', id, updates: dbUpdates }] }));
    });
  },

  // ── Task mutations ────────────────────────────────────────────────────────────

  addTask: (task) => {
    set((s) => ({ tasks: [...s.tasks, task] }));
    const { isOnline } = get();
    const db = taskToDb(task);
    if (!isOnline) {
      set((s) => ({ pendingSyncs: [...s.pendingSyncs, { type: 'upsertTask', data: db }] }));
      return;
    }
    upsertTask(task).catch(() => {
      set((s) => ({ pendingSyncs: [...s.pendingSyncs, { type: 'upsertTask', data: db }] }));
    });
  },

  updateTask: (id, updates) => {
    set((s) => ({
      tasks: s.tasks.map((t) =>
        t.id === id ? { ...t, ...updates, updatedAt: new Date().toISOString() } : t
      ),
    }));
    const { isOnline } = get();
    const task = get().tasks.find((t) => t.id === id);
    if (!task) return;
    const dbUpdates: Partial<DbTask> = {};
    if (updates.title !== undefined)       dbUpdates.title       = updates.title;
    if (updates.description !== undefined) dbUpdates.description = updates.description;
    if (updates.status !== undefined)      dbUpdates.status      = updates.status;
    if (updates.priority !== undefined)    dbUpdates.priority    = updates.priority;
    if (updates.assignee !== undefined)    dbUpdates.assignee    = updates.assignee;
    if (updates.dueDate !== undefined)     dbUpdates.due_date    = updates.dueDate;
    if (updates.tags !== undefined)        dbUpdates.tags        = updates.tags;
    if (updates.checklist !== undefined)   dbUpdates.checklist   = updates.checklist;
    if (updates.comments !== undefined)    dbUpdates.comments    = updates.comments;
    if (!isOnline) {
      set((s) => ({ pendingSyncs: [...s.pendingSyncs, { type: 'patchTask', id, updates: dbUpdates }] }));
      return;
    }
    patchTask(id, dbUpdates).catch(() => {
      set((s) => ({ pendingSyncs: [...s.pendingSyncs, { type: 'patchTask', id, updates: dbUpdates }] }));
    });
  },

  deleteTask: (id) => {
    set((s) => ({ tasks: s.tasks.filter((t) => t.id !== id) }));
    const { isOnline } = get();
    if (!isOnline) {
      set((s) => ({ pendingSyncs: [...s.pendingSyncs, { type: 'deleteTask', id }] }));
      return;
    }
    removeTask(id).catch(() => {
      set((s) => ({ pendingSyncs: [...s.pendingSyncs, { type: 'deleteTask', id }] }));
    });
  },

  moveTask: (taskId, newStatus, newOrder) => {
    set((s) => ({
      tasks: s.tasks.map((t) =>
        t.id === taskId
          ? { ...t, status: newStatus, order: newOrder, updatedAt: new Date().toISOString() }
          : t
      ),
    }));
    const { isOnline } = get();
    const updates: Partial<DbTask> = { status: newStatus, order_index: newOrder };
    if (!isOnline) {
      set((s) => ({ pendingSyncs: [...s.pendingSyncs, { type: 'patchTask', id: taskId, updates }] }));
      return;
    }
    patchTask(taskId, updates).catch(() => {
      set((s) => ({ pendingSyncs: [...s.pendingSyncs, { type: 'patchTask', id: taskId, updates }] }));
    });
  },

  reorderTask: (taskId, targetTaskId, status) => {
    set((s) => {
      const tasks = [...s.tasks];
      const movingIdx = tasks.findIndex((t) => t.id === taskId);
      const targetIdx = tasks.findIndex((t) => t.id === targetTaskId);
      if (movingIdx === -1 || targetIdx === -1) return s;
      const [moved] = tasks.splice(movingIdx, 1);
      moved.status = status;
      tasks.splice(targetIdx, 0, moved);
      return { tasks };
    });
    // Sync the moved task's status
    const { isOnline } = get();
    const updates: Partial<DbTask> = { status };
    if (!isOnline) {
      set((s) => ({ pendingSyncs: [...s.pendingSyncs, { type: 'patchTask', id: taskId, updates }] }));
      return;
    }
    patchTask(taskId, updates).catch(() => {
      set((s) => ({ pendingSyncs: [...s.pendingSyncs, { type: 'patchTask', id: taskId, updates }] }));
    });
  },
}));

// ─── Selectors ────────────────────────────────────────────────────────────────

export const selectProjectTasks = (tasks: Task[], projectId: string) =>
  tasks.filter((t) => t.projectId === projectId);

export const selectFilteredTasks = (
  tasks: Task[],
  projectId: string,
  query: string,
  assigneeId: string | null,
  priorityFilter: string | null
) => {
  let filtered = tasks.filter((t) => t.projectId === projectId);
  if (query) {
    const q = query.toLowerCase();
    filtered = filtered.filter(
      (t) =>
        t.title.toLowerCase().includes(q) ||
        t.tags.some((tag) => tag.toLowerCase().includes(q))
    );
  }
  if (assigneeId)    filtered = filtered.filter((t) => t.assignee?.id === assigneeId);
  if (priorityFilter) filtered = filtered.filter((t) => t.priority === priorityFilter);
  return filtered;
};

export const selectProjectStats = (tasks: Task[], projectId: string) => {
  const projectTasks = tasks.filter((t) => t.projectId === projectId);
  const done  = projectTasks.filter((t) => t.status === 'done').length;
  const total = projectTasks.length;
  return {
    total,
    done,
    completion: total > 0 ? Math.round((done / total) * 100) : 0,
    byStatus: {
      backlog:     projectTasks.filter((t) => t.status === 'backlog').length,
      todo:        projectTasks.filter((t) => t.status === 'todo').length,
      in_progress: projectTasks.filter((t) => t.status === 'in_progress').length,
      review:      projectTasks.filter((t) => t.status === 'review').length,
      done,
    },
  };
};
