import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard, BarChart3, Plus, ChevronDown,
  Zap, Settings, Moon, Sun, FolderKanban, ChevronUp, LogOut,
} from 'lucide-react';
import { cn } from '../utils';
import { useAppStore, selectProjectStats } from '../store/useAppStore';
import { Avatar } from './ui/Avatar';
import { CreateProjectModal } from './CreateProjectModal';
import { supabase } from '../lib/supabase';

export function Sidebar() {
  const navigate = useNavigate();
  const location = useLocation();
  const { projects, tasks, activeProjectId, setActiveProject, theme, toggleTheme, currentUser } = useAppStore();
  const [projectsOpen, setProjectsOpen] = useState(true);
  const [createOpen, setCreateOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);

  const handleProjectClick = (id: string) => {
    setActiveProject(id);
    navigate(`/board/${id}`);
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
  };

  return (
    <>
      <aside className="flex flex-col w-64 shrink-0 border-r border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 h-screen sticky top-0 overflow-y-auto">
        {/* Logo */}
        <div className="flex items-center gap-2.5 px-5 py-5 border-b border-gray-100 dark:border-gray-800">
          <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-brand-500 to-brand-700 flex items-center justify-center shadow-sm shrink-0">
            <Zap className="h-4 w-4 text-white" />
          </div>
          <div>
            <span className="font-bold text-gray-900 dark:text-white text-sm tracking-tight">KanbanPro</span>
            <div className="text-[10px] text-muted">Enterprise Edition</div>
          </div>
        </div>

        {/* Nav links */}
        <nav className="px-3 py-4 space-y-0.5">
          <NavItem
            icon={<LayoutDashboard className="h-4 w-4" />}
            label="Dashboard"
            active={location.pathname === '/'}
            onClick={() => navigate('/')}
          />
          <NavItem
            icon={<FolderKanban className="h-4 w-4" />}
            label="All Projects"
            active={location.pathname === '/projects'}
            onClick={() => navigate('/projects')}
          />
        </nav>

        {/* Projects section */}
        <div className="px-3 flex-1">
          <button
            onClick={() => setProjectsOpen((p) => !p)}
            className="w-full flex items-center justify-between px-2 py-1.5 rounded-lg text-xs font-semibold text-muted uppercase tracking-widest hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
          >
            <span>Projects</span>
            <ChevronDown className={cn('h-3 w-3 transition-transform', projectsOpen ? '' : '-rotate-90')} />
          </button>

          <AnimatePresence initial={false}>
            {projectsOpen && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="overflow-hidden"
              >
                <div className="space-y-0.5 mt-1">
                  {projects.map((project) => {
                    const stats = selectProjectStats(tasks, project.id);
                    const isActive = activeProjectId === project.id && location.pathname.startsWith('/board');
                    return (
                      <button
                        key={project.id}
                        onClick={() => handleProjectClick(project.id)}
                        title={project.name}
                        className={cn(
                          'w-full flex flex-col gap-1 px-2.5 py-2 rounded-lg text-sm transition-all duration-150 text-left group',
                          isActive
                            ? 'bg-brand-50 dark:bg-brand-900/20 text-brand-700 dark:text-brand-300'
                            : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-gray-200'
                        )}
                      >
                        {/* Name row */}
                        <div className="flex items-center gap-2 w-full">
                          <span
                            className="h-2 w-2 rounded-full shrink-0"
                            style={{ backgroundColor: project.color }}
                          />
                          <span className="flex-1 font-medium text-[13px] leading-snug break-words min-w-0">
                            {project.name}
                          </span>
                          <span className="text-[10px] text-muted tabular-nums shrink-0">
                            {stats.completion}%
                          </span>
                        </div>
                        {/* Progress bar */}
                        <div className="ml-4 h-[3px] w-full bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                          <div
                            className="h-full rounded-full transition-all duration-500"
                            style={{
                              width: `${stats.completion}%`,
                              backgroundColor: project.color,
                            }}
                          />
                        </div>
                      </button>
                    );
                  })}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Divider before New Project */}
          <div className="border-t border-gray-100 dark:border-gray-800 mt-2 mb-1" />

          <button
            onClick={() => setCreateOpen(true)}
            className="w-full flex items-center gap-2 px-2.5 py-2 rounded-lg text-sm text-brand-600 dark:text-brand-400 hover:bg-brand-50 dark:hover:bg-brand-900/20 transition-colors font-medium"
          >
            <Plus className="h-4 w-4" />
            New Project
          </button>
        </div>

        {/* Divider before bottom actions */}
        <div className="border-t border-gray-100 dark:border-gray-800 mt-2" />

        {/* Bottom actions */}
        <div className="px-3 py-3 space-y-0.5">
          <NavItem
            icon={<BarChart3 className="h-4 w-4" />}
            label="Analytics"
            active={location.pathname === '/analytics'}
            onClick={() => navigate('/analytics')}
          />
          <NavItem
            icon={<Settings className="h-4 w-4" />}
            label="Settings"
            active={false}
            onClick={() => {}}
          />

          {/* Theme pill toggle */}
          <div className="flex items-center justify-between px-3 py-2">
            <span className="text-sm text-gray-600 dark:text-gray-400 font-medium">
              {theme === 'dark' ? 'Dark mode' : 'Light mode'}
            </span>
            <button
              onClick={toggleTheme}
              aria-label="Toggle theme"
              className={cn(
                'relative inline-flex h-5 w-9 items-center rounded-full transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500',
                theme === 'dark'
                  ? 'bg-brand-600'
                  : 'bg-gray-300 dark:bg-gray-600'
              )}
            >
              <span
                className={cn(
                  'inline-flex h-4 w-4 items-center justify-center rounded-full bg-white shadow-sm transform transition-transform duration-200',
                  theme === 'dark' ? 'translate-x-4' : 'translate-x-0.5'
                )}
              >
                {theme === 'dark'
                  ? <Moon className="h-2.5 w-2.5 text-brand-600" />
                  : <Sun className="h-2.5 w-2.5 text-yellow-500" />
                }
              </span>
            </button>
          </div>
        </div>

        {/* Current user — interactive */}
        <div className="border-t border-gray-100 dark:border-gray-800">
          <button
            onClick={() => setProfileOpen((p) => !p)}
            className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors group"
          >
            <Avatar user={currentUser} size="sm" />
            <div className="min-w-0 flex-1 text-left">
              <div className="text-xs font-semibold text-gray-900 dark:text-gray-100 truncate">
                {currentUser?.name ?? 'User'}
              </div>
              <div className="text-[10px] text-muted truncate">
                {currentUser?.role ?? ''}
              </div>
            </div>
            {profileOpen
              ? <ChevronUp className="h-3.5 w-3.5 text-gray-400 shrink-0" />
              : <ChevronDown className="h-3.5 w-3.5 text-gray-400 shrink-0" />
            }
          </button>

          {/* Dropdown stub */}
          <AnimatePresence>
            {profileOpen && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="overflow-hidden border-t border-gray-100 dark:border-gray-800"
              >
                <button className="w-full text-left px-5 py-2 text-xs text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-gray-200 transition-colors">
                  View profile
                </button>
                <button className="w-full text-left px-5 py-2 text-xs text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-gray-200 transition-colors">
                  Account settings
                </button>
                <button
                  onClick={handleSignOut}
                  className="w-full text-left px-5 py-2 text-xs text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-700 dark:hover:text-red-400 transition-colors flex items-center gap-2"
                >
                  <LogOut className="h-3 w-3" />
                  Sign out
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </aside>

      <CreateProjectModal open={createOpen} onClose={() => setCreateOpen(false)} />
    </>
  );
}

function NavItem({
  icon, label, active, onClick,
}: {
  icon: React.ReactNode;
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-150',
        active
          ? 'bg-brand-50 dark:bg-brand-900/20 text-brand-700 dark:text-brand-300'
          : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-gray-200'
      )}
    >
      {icon}
      {label}
    </button>
  );
}
