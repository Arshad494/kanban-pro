import { useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAppStore } from '../store/useAppStore';

/**
 * Subscribes to Supabase realtime changes on the `projects` and `tasks` tables
 * and patches the Zustand store in place. Call once at AppShell level.
 */
export function useRealtime() {
  const handleRealtimeEvent = useAppStore((s) => s.handleRealtimeEvent);

  useEffect(() => {
    const channel = supabase
      .channel('kanban-realtime')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'projects' },
        (payload) => handleRealtimeEvent('projects', payload)
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'tasks' },
        (payload) => handleRealtimeEvent('tasks', payload)
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
}
