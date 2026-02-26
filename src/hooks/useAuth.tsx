import { useEffect } from 'react';
import type { Session } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import { useAppStore } from '../store/useAppStore';
import type { User } from '../types';

function sessionToUser(session: Session): User {
  const meta = session.user.user_metadata ?? {};
  const name  = (meta['full_name'] as string | undefined)
    ?? (meta['name'] as string | undefined)
    ?? session.user.email?.split('@')[0]
    ?? 'User';
  return {
    id:     session.user.id,
    name,
    email:  session.user.email ?? '',
    avatar: name.charAt(0).toUpperCase(),
    role:   'Member',
    color:  '#5a67f2',
  };
}

/**
 * Runs once at app root. Syncs the Supabase session with the Zustand store
 * and triggers data initialization after sign-in.
 */
export function useAuthSync() {
  const { setCurrentUser, initialize } = useAppStore();

  useEffect(() => {
    // Handle magic-link / OAuth redirect: exchange the code/token in the URL
    // for a real session before calling getSession (PKCE flow).
    const hash = window.location.hash;
    const params = new URLSearchParams(window.location.search);
    if (hash.includes('access_token') || params.get('code') || params.get('token_hash')) {
      // Let the Supabase client exchange the code — onAuthStateChange will fire
      supabase.auth.exchangeCodeForSession(window.location.href).catch(() => {
        // If it fails (e.g. already consumed), fall through to getSession below
      });
    }

    // Initial session check
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        setCurrentUser(sessionToUser(session));
        initialize();
      } else {
        setCurrentUser(null);
        initialize();   // mark as initialized so the UI unblocks
      }
    });

    // Listen for sign-in / sign-out events
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (session) {
        setCurrentUser(sessionToUser(session));  // flips isInitialized → false
        initialize();                            // then fetches data → flips back to true
        // Clean auth tokens/codes from the URL after a successful redirect
        if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
          window.history.replaceState({}, document.title, window.location.pathname);
        }
      } else {
        setCurrentUser(null);                    // clears data, keeps isInitialized true → AuthPage
      }
    });

    return () => subscription.unsubscribe();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
}
