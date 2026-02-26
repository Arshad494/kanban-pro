import { useEffect } from 'react';
import { useAppStore } from '../store/useAppStore';

/** Tracks window online/offline events and flushes pending syncs when reconnected. */
export function useOnlineSync() {
  const { setOnline, flushPendingSyncs } = useAppStore();

  useEffect(() => {
    const handleOnline = () => {
      setOnline(true);
      flushPendingSyncs();
    };
    const handleOffline = () => setOnline(false);

    window.addEventListener('online',  handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online',  handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
}
