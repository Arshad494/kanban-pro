# KanbanPro — Production Deployment Checklist

Generated: 2026-02-26
Project: `C:\Users\LENOVO\kanban-pro`
Supabase project: `slvnnkbjbnhwgcodrjfc`

---

## ✅ Pre-flight Checks (all verified automatically)

| Check | Result | Detail |
|---|---|---|
| `npm run build` | ✅ PASSED | 3151 modules, 0 errors |
| `tsc --noEmit` | ✅ PASSED | 0 type errors |
| `npm audit` | ✅ PASSED | 0 vulnerabilities |
| `.env.local` | ✅ EXISTS | VITE_SUPABASE_URL + VITE_SUPABASE_ANON_KEY |
| `.env.local` in `.gitignore` | ✅ SAFE | Matched by `*.local` rule |
| `node_modules` installed | ✅ 40+ packages | All compatible |
| Node version | ✅ v22.17.0 | |
| Git repo initialized | ✅ Done | First commit pending |
| `vercel.json` SPA rewrites | ✅ EXISTS | All routes → index.html |
| `netlify.toml` redirects | ✅ EXISTS | All routes → index.html |

---

## 📋 Manual Steps Required (in order)

### 1 · Push to GitHub (5 min)

```bash
# Already initialized — just add remote and push:
git remote add origin https://github.com/YOUR_USERNAME/kanban-pro.git
git branch -M main
git push -u origin main
```

> Create the repo first at **https://github.com/new**
> Name: `kanban-pro` | Visibility: Private | **Don't** add README/gitignore (we have them)

---

### 2 · Deploy to Vercel (3 min)

1. Go to **https://vercel.com/new**
2. Click **Import Git Repository** → select `kanban-pro`
3. Framework preset: **Vite** (auto-detected — leave as-is)
4. Expand **Environment Variables** → add both:

| Name | Value |
|---|---|
| `VITE_SUPABASE_URL` | `https://slvnnkbjbnhwgcodrjfc.supabase.co` |
| `VITE_SUPABASE_ANON_KEY` | `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNsdm5ua2JqYm5od2djb2RyamZjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzIxMTgwNjMsImV4cCI6MjA4NzY5NDA2M30.IXETThpwaJ-A9_NNQYa8XvvfbswXgMyXqerRDvWhqWI` |

5. Click **Deploy** → wait ~60 seconds → copy your URL (e.g. `https://kanban-pro-abc123.vercel.app`)

---

### 3 · Update Supabase allowed URLs (2 min)

Go to **https://supabase.com/dashboard/project/slvnnkbjbnhwgcodrjfc/auth/url-configuration**

| Field | Add this value |
|---|---|
| Site URL | `https://kanban-pro-abc123.vercel.app` (your actual URL) |
| Redirect URLs | `https://kanban-pro-abc123.vercel.app` |
| Redirect URLs | `http://localhost:5173` (keep for local dev) |

Click **Save**.

---

### 4 · Google OAuth setup (10 min) — needed for Google sign-in

#### 4a · Google Cloud Console

1. **https://console.cloud.google.com/apis/credentials**
2. Select/create a project
3. If prompted: **Configure Consent Screen** → External → fill in App name (`KanbanPro`) + your email → Save
4. **+ CREATE CREDENTIALS → OAuth client ID**
   - Application type: **Web application**
   - Name: `KanbanPro`
   - Authorized JavaScript origins:
     - `http://localhost:5173`
     - `https://kanban-pro-abc123.vercel.app`
   - Authorized redirect URIs:
     - `https://slvnnkbjbnhwgcodrjfc.supabase.co/auth/v1/callback`
5. Click **Create** → copy **Client ID** and **Client Secret**

#### 4b · Supabase Dashboard

1. **https://supabase.com/dashboard/project/slvnnkbjbnhwgcodrjfc/auth/providers**
2. Find **Google** → toggle **Enable**
3. Paste **Client ID** and **Client Secret**
4. Click **Save**

> ✉️  **Email magic-link sign-in works right now without this step** — Google OAuth is optional.

---

### 5 · Custom domain on Vercel (optional)

1. Vercel Dashboard → your project → **Settings → Domains**
2. Add your domain → follow CNAME/A record instructions from your registrar
3. After DNS propagates, add the new domain to:
   - Supabase Redirect URLs (step 3 above)
   - Google Cloud Authorized JavaScript Origins (step 4a above)

---

## 🔑 Copy-paste values

```
Supabase project ref:  slvnnkbjbnhwgcodrjfc
Supabase URL:          https://slvnnkbjbnhwgcodrjfc.supabase.co
Supabase auth callback: https://slvnnkbjbnhwgcodrjfc.supabase.co/auth/v1/callback
Supabase dashboard:    https://supabase.com/dashboard/project/slvnnkbjbnhwgcodrjfc
Local dev URL:         http://localhost:5173
```

---

## 🐛 Troubleshooting

### "Could not find table 'public.projects'" after sign-in
The schema SQL hasn't been applied yet. Run `supabase/schema.sql` in:
**https://supabase.com/dashboard/project/slvnnkbjbnhwgcodrjfc/sql/new**

### Blank screen after Google OAuth redirect
- Check that your Vercel URL is in **Supabase Redirect URLs**
- Check that your Vercel URL is in **Google Authorized JavaScript Origins**
- Check browser console for CORS errors

### "Email rate limit exceeded" on local dev
Supabase free tier limits auth emails. Wait 1 hour or use Google OAuth instead.

### Sign-in works but board never loads (infinite spinner)
Supabase anon key in Vercel env vars might be truncated. Re-paste the full key — it's 218 characters long.

### Realtime not syncing between tabs
1. Confirm `supabase_realtime` publication exists: run `SELECT * FROM pg_publication;` in Supabase SQL editor
2. Re-run the `ALTER PUBLICATION supabase_realtime ADD TABLE...` lines from `supabase/schema.sql`

### Build fails on Vercel with "Cannot find module"
Node version mismatch. In Vercel project settings → General → Node.js Version → set to **22.x**

### Vite env vars missing in production build
Variable names MUST start with `VITE_`. Check spelling in Vercel dashboard exactly matches `.env.local`.

---

## 📁 Project structure reference

```
kanban-pro/
├── src/
│   ├── lib/
│   │   ├── supabase.ts        ← Supabase client
│   │   └── db.ts              ← CRUD + transforms
│   ├── hooks/
│   │   ├── useAuth.tsx        ← Session sync
│   │   ├── useOnline.ts       ← Offline detection
│   │   └── useRealtime.ts     ← postgres_changes subscriptions
│   ├── store/useAppStore.ts   ← Zustand (optimistic updates + offline queue)
│   └── pages/
│       ├── AuthPage.tsx       ← Google OAuth + email magic link
│       └── SharedBoardPage.tsx ← Public read-only view (no auth)
├── supabase/schema.sql        ← Run once in Supabase SQL editor
├── .env.local                 ← ⚠️ Never commit (covered by .gitignore)
├── vercel.json                ← SPA routing rewrites
└── netlify.toml               ← Alternative deployment
```
