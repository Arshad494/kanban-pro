import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppStore } from '../store/useAppStore';

export function useKeyboardShortcuts() {
  const navigate = useNavigate();
  const { toggleTheme, activeProjectId, setSearchQuery } = useAppStore();

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const active = document.activeElement;
      const isInput = active?.tagName === 'INPUT' || active?.tagName === 'TEXTAREA' || active?.tagName === 'SELECT';

      // D → Dashboard
      if (!isInput && e.key === 'd' && !e.metaKey && !e.ctrlKey) {
        navigate('/');
      }

      // B → Board
      if (!isInput && e.key === 'b' && !e.metaKey && !e.ctrlKey && activeProjectId) {
        navigate(`/board/${activeProjectId}`);
      }

      // A → Analytics
      if (!isInput && e.key === 'a' && !e.metaKey && !e.ctrlKey) {
        navigate('/analytics');
      }

      // T → Toggle theme
      if (!isInput && e.key === 't' && !e.metaKey && !e.ctrlKey) {
        toggleTheme();
      }

      // Escape → clear search
      if (e.key === 'Escape') {
        setSearchQuery('');
      }

      // Cmd/Ctrl + K → focus search (noop — board has its own search input)
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        const input = document.querySelector('input[placeholder*="Search"]') as HTMLInputElement;
        input?.focus();
      }
    };

    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [navigate, toggleTheme, activeProjectId, setSearchQuery]);
}
