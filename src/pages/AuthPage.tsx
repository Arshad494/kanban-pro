import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Zap, Loader2, Mail, ArrowLeft, CheckCircle2 } from 'lucide-react';
import { supabase } from '../lib/supabase';

type View = 'home' | 'email-sent';

export function AuthPage() {
  const [view, setView]         = useState<View>('home');
  const [email, setEmail]       = useState('');
  const [loadingGoogle, setLG]  = useState(false);
  const [loadingEmail, setLE]   = useState(false);
  const [error, setError]       = useState<string | null>(null);

  // ── Google OAuth ────────────────────────────────────────────────────────────
  const handleGoogle = async () => {
    setLG(true); setError(null);
    const { error: err } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: window.location.origin },
    });
    if (err) { setError(err.message); setLG(false); }
  };

  // ── Email magic-link (OTP) ───────────────────────────────────────────────────
  const handleEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    setLE(true); setError(null);
    const { error: err } = await supabase.auth.signInWithOtp({
      email: email.trim(),
      options: { shouldCreateUser: true },
    });
    if (err) { setError(err.message); setLE(false); }
    else     { setView('email-sent'); setLE(false); }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950 px-4">
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, ease: 'easeOut' }}
        className="w-full max-w-sm"
      >
        {/* Logo */}
        <div className="flex items-center justify-center gap-3 mb-10">
          <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-brand-500 to-brand-700 flex items-center justify-center shadow-lg shrink-0">
            <Zap className="h-5 w-5 text-white" />
          </div>
          <div>
            <div className="text-xl font-bold text-gray-900 dark:text-white tracking-tight">KanbanPro</div>
            <div className="text-[11px] text-muted">Enterprise Edition</div>
          </div>
        </div>

        <div className="card p-8">
          <AnimatePresence mode="wait">

            {/* ── Home view ─────────────────────────────────────────────────── */}
            {view === 'home' && (
              <motion.div
                key="home"
                initial={{ opacity: 0, x: -12 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 12 }}
                transition={{ duration: 0.2 }}
              >
                <h1 className="text-xl font-bold text-gray-900 dark:text-white mb-1">Welcome back</h1>
                <p className="text-sm text-muted mb-7">
                  Sign in to access your projects and collaborate in real time.
                </p>

                {/* Google */}
                <button
                  onClick={handleGoogle}
                  disabled={loadingGoogle}
                  className="w-full flex items-center justify-center gap-3 h-11 px-4 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm font-semibold text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors disabled:opacity-60 disabled:cursor-not-allowed shadow-sm"
                >
                  {loadingGoogle ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <svg className="h-4 w-4 shrink-0" viewBox="0 0 24 24" fill="none">
                      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
                      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                    </svg>
                  )}
                  {loadingGoogle ? 'Redirecting…' : 'Continue with Google'}
                </button>

                {/* Divider */}
                <div className="flex items-center gap-3 my-5">
                  <div className="flex-1 h-px bg-gray-200 dark:bg-gray-700" />
                  <span className="text-xs text-muted">or</span>
                  <div className="flex-1 h-px bg-gray-200 dark:bg-gray-700" />
                </div>

                {/* Email magic link */}
                <form onSubmit={handleEmail} className="space-y-3">
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
                    <input
                      type="email"
                      placeholder="your@email.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      className="w-full h-11 pl-10 pr-4 text-sm rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-400 outline-none focus:ring-2 focus:ring-brand-400 transition-shadow"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={loadingEmail || !email.trim()}
                    className="w-full h-11 rounded-xl bg-brand-600 hover:bg-brand-700 text-white text-sm font-semibold transition-colors disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {loadingEmail && <Loader2 className="h-4 w-4 animate-spin" />}
                    Continue with Email
                  </button>
                </form>

                {error && (
                  <p className="mt-4 text-xs text-red-500 text-center">{error}</p>
                )}

                <p className="mt-6 text-center text-xs text-muted">
                  By signing in you agree to our{' '}
                  <span className="text-brand-600 dark:text-brand-400 cursor-pointer hover:underline">Terms</span>
                  {' & '}
                  <span className="text-brand-600 dark:text-brand-400 cursor-pointer hover:underline">Privacy Policy</span>.
                </p>
              </motion.div>
            )}

            {/* ── Email-sent view ───────────────────────────────────────────── */}
            {view === 'email-sent' && (
              <motion.div
                key="sent"
                initial={{ opacity: 0, x: 12 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -12 }}
                transition={{ duration: 0.2 }}
                className="text-center"
              >
                <div className="flex justify-center mb-5">
                  <div className="h-14 w-14 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                    <CheckCircle2 className="h-7 w-7 text-green-500" />
                  </div>
                </div>
                <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-2">Check your inbox</h2>
                <p className="text-sm text-muted mb-1">
                  We sent a magic link to
                </p>
                <p className="text-sm font-semibold text-gray-900 dark:text-white mb-6 break-all">
                  {email}
                </p>
                <p className="text-xs text-muted mb-6">
                  Click the link in the email to sign in. No password needed.<br />
                  Check your spam folder if you don't see it within a minute.
                </p>
                <button
                  onClick={() => { setView('home'); setError(null); }}
                  className="inline-flex items-center gap-1.5 text-xs text-brand-600 dark:text-brand-400 hover:underline"
                >
                  <ArrowLeft className="h-3 w-3" />
                  Use a different email
                </button>
              </motion.div>
            )}

          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
}
