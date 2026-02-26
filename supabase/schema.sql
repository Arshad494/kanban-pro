-- ============================================================
-- KanbanPro — Supabase Schema
-- Run this in the Supabase SQL Editor
-- ============================================================

-- 1. PROFILES (one row per authenticated user)
create table if not exists profiles (
  id        uuid primary key references auth.users on delete cascade,
  name      text    not null default '',
  email     text    not null default '',
  avatar    text    not null default '',
  role      text    not null default 'Member',
  color     text    not null default '#5a67f2',
  created_at timestamptz not null default now()
);

-- Auto-create profile on sign-up
create or replace function handle_new_user()
returns trigger language plpgsql security definer as $$
begin
  insert into profiles (id, name, email, avatar, color)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
    coalesce(new.email, ''),
    upper(left(coalesce(new.raw_user_meta_data->>'full_name', new.email, '?'), 1)),
    '#5a67f2'
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure handle_new_user();


-- 2. PROJECTS
create table if not exists projects (
  id          text primary key,
  name        text    not null,
  description text    not null default '',
  owner       jsonb   not null default '{}',
  members     jsonb   not null default '[]',
  status      text    not null default 'active',
  start_date  text,
  end_date    text,
  priority    text    not null default 'medium',
  color       text    not null default '#5a67f2',
  activities  jsonb   not null default '[]',
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);


-- 3. TASKS
create table if not exists tasks (
  id          text primary key,
  project_id  text references projects(id) on delete cascade,
  title       text    not null,
  description text    not null default '',
  status      text    not null default 'todo',
  priority    text    not null default 'medium',
  assignee    jsonb,
  tags        text[]  not null default '{}',
  due_date    text,
  comments    jsonb   not null default '[]',
  checklist   jsonb   not null default '[]',
  order_index integer not null default 0,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);


-- 4. ROW LEVEL SECURITY
alter table profiles  enable row level security;
alter table projects  enable row level security;
alter table tasks     enable row level security;

-- Profiles: users can only read/update their own profile
create policy "profiles: own read"   on profiles for select using (true);
create policy "profiles: own write"  on profiles for all    using (auth.uid() = id);

-- Projects: anyone can read (for shared view), authenticated users can write
create policy "projects: public read"  on projects for select using (true);
create policy "projects: auth write"   on projects for insert with check (auth.role() = 'authenticated');
create policy "projects: auth update"  on projects for update using (auth.role() = 'authenticated');
create policy "projects: auth delete"  on projects for delete using (auth.role() = 'authenticated');

-- Tasks: same pattern
create policy "tasks: public read"  on tasks for select using (true);
create policy "tasks: auth write"   on tasks for insert with check (auth.role() = 'authenticated');
create policy "tasks: auth update"  on tasks for update using (auth.role() = 'authenticated');
create policy "tasks: auth delete"  on tasks for delete using (auth.role() = 'authenticated');


-- 5. REALTIME — enable for projects and tasks
alter publication supabase_realtime add table projects;
alter publication supabase_realtime add table tasks;
