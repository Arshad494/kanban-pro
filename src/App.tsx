import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { WifiOff, Loader2 } from 'lucide-react';
import { Sidebar } from './components/Sidebar';
import { Dashboard } from './pages/Dashboard';
import { BoardPage } from './pages/BoardPage';
import { AnalyticsPage } from './pages/AnalyticsPage';
import { SharedBoardPage } from './pages/SharedBoardPage';
import { AuthPage } from './pages/AuthPage';
import { ToastProvider } from './components/ui/Toast';
import { useAppStore } from './store/useAppStore';
import { useAuthSync } from './hooks/useAuth';
import { useOnlineSync } from './hooks/useOnline';
import { useRealtime } from './hooks/useRealtime';
import { useKeyboardShortcuts } from './hooks/useKeyboardShortcuts';

function AppShell() {
  useKeyboardShortcuts();
  useRealtime();

  const { isOnline, pendingSyncs } = useAppStore();

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50 dark:bg-gray-950">
      {/* Offline banner */}
      <AnimatePresence>
        {!isOnline && (
          <motion.div
            initial={{ y: -40, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -40, opacity: 0 }}
            className="fixed top-0 inset-x-0 z-50 flex items-center justify-center gap-2 bg-yellow-500 text-white text-xs font-semibold py-1.5"
          >
            <WifiOff className="h-3.5 w-3.5" />
            You're offline — changes are queued
            {pendingSyncs.length > 0 && (
              <span className="bg-white/20 rounded-full px-1.5">
                {pendingSyncs.length} pending
              </span>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      <Sidebar />
      <main className="flex-1 overflow-y-auto overflow-x-hidden">
        <Routes>
          <Route path="/"          element={<Dashboard />} />
          <Route path="/board/:projectId" element={<BoardPage />} />
          <Route path="/analytics" element={<AnalyticsPage />} />
          <Route path="/projects"  element={<Dashboard />} />
          <Route path="*"          element={<Navigate to="/" replace />} />
        </Routes>
      </main>
    </div>
  );
}

function AuthGate() {
  const { currentUser, isInitialized } = useAppStore();

  if (!isInitialized) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950">
        <Loader2 className="h-8 w-8 text-brand-500 animate-spin" />
      </div>
    );
  }

  if (!currentUser) return <AuthPage />;
  return <AppShell />;
}

function AppProviders() {
  useAuthSync();
  useOnlineSync();

  const { theme } = useAppStore();

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark');
  }, [theme]);

  return (
    <Routes>
      {/* Shared view — no auth required */}
      <Route path="/shared/:projectId" element={<SharedBoardPage />} />
      {/* Everything else goes through auth gate */}
      <Route path="/*" element={<AuthGate />} />
    </Routes>
  );
}

export default function App() {
  return (
    <ToastProvider>
      <BrowserRouter>
        <AppProviders />
      </BrowserRouter>
    </ToastProvider>
  );
}
