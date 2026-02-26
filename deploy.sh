#!/usr/bin/env bash
# ============================================================
# KanbanPro — Deployment script (bash / Git Bash on Windows)
# Usage: bash deploy.sh [--push]
# ============================================================

set -euo pipefail

# ── Colours ──────────────────────────────────────────────────────────────────
RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'
CYAN='\033[0;36m'; BOLD='\033[1m'; NC='\033[0m'

pass() { echo -e "${GREEN}✅ $*${NC}"; }
fail() { echo -e "${RED}❌ $*${NC}"; exit 1; }
warn() { echo -e "${YELLOW}⚠️  $*${NC}"; }
info() { echo -e "${CYAN}ℹ  $*${NC}"; }
step() { echo -e "\n${BOLD}$*${NC}"; }

echo -e "${BOLD}╔════════════════════════════════════════╗${NC}"
echo -e "${BOLD}║   KanbanPro Production Deploy Check    ║${NC}"
echo -e "${BOLD}╚════════════════════════════════════════╝${NC}"

# ── 1. Environment check ─────────────────────────────────────────────────────
step "1/5  Environment variables"

if [[ ! -f ".env.local" ]]; then
  fail ".env.local not found. Create it with VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY"
fi

SUPABASE_URL=$(grep "^VITE_SUPABASE_URL=" .env.local | cut -d= -f2- | tr -d '[:space:]')
SUPABASE_KEY=$(grep "^VITE_SUPABASE_ANON_KEY=" .env.local | cut -d= -f2- | tr -d '[:space:]')

[[ -z "$SUPABASE_URL" ]]  && fail "VITE_SUPABASE_URL is empty in .env.local"
[[ -z "$SUPABASE_KEY" ]]  && fail "VITE_SUPABASE_ANON_KEY is empty in .env.local"
[[ ${#SUPABASE_KEY} -lt 100 ]] && fail "VITE_SUPABASE_ANON_KEY looks truncated (${#SUPABASE_KEY} chars, expected ~218)"

pass "VITE_SUPABASE_URL   = $SUPABASE_URL"
pass "VITE_SUPABASE_ANON_KEY = ${SUPABASE_KEY:0:30}… (${#SUPABASE_KEY} chars)"

# ── 2. Supabase connectivity ──────────────────────────────────────────────────
step "2/5  Supabase connectivity"

HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" \
  "$SUPABASE_URL/rest/v1/projects?select=id&limit=1" \
  -H "apikey: $SUPABASE_KEY" \
  -H "Authorization: Bearer $SUPABASE_KEY")

if [[ "$HTTP_CODE" == "200" ]]; then
  pass "Supabase REST API reachable (HTTP $HTTP_CODE)"
elif [[ "$HTTP_CODE" == "401" || "$HTTP_CODE" == "403" ]]; then
  fail "Supabase returned $HTTP_CODE — check your anon key or RLS policies"
else
  warn "Supabase returned HTTP $HTTP_CODE — might be offline or schema not applied"
fi

# ── 3. TypeScript check ──────────────────────────────────────────────────────
step "3/5  TypeScript"

if npx tsc --noEmit 2>&1; then
  pass "tsc --noEmit — 0 errors"
else
  fail "TypeScript errors found. Fix them before deploying."
fi

# ── 4. Production build ───────────────────────────────────────────────────────
step "4/5  Production build"

if npm run build 2>&1; then
  DIST_SIZE=$(du -sh dist/ 2>/dev/null | cut -f1 || echo "?")
  pass "Build succeeded — dist/ is $DIST_SIZE"
else
  fail "Build failed. Check errors above."
fi

# ── 5. Git push (optional) ────────────────────────────────────────────────────
step "5/5  Git"

if [[ "${1:-}" == "--push" ]]; then
  if ! git rev-parse --git-dir > /dev/null 2>&1; then
    fail "Not a git repository. Run: git init && git remote add origin <url>"
  fi

  REMOTE=$(git remote get-url origin 2>/dev/null || echo "")
  [[ -z "$REMOTE" ]] && fail "No git remote 'origin'. Run: git remote add origin <your-repo-url>"

  info "Staging all changes..."
  git add -A

  if git diff --cached --quiet; then
    warn "Nothing new to commit — working tree clean"
  else
    git commit -m "chore: production deployment $(date '+%Y-%m-%d %H:%M')"
    pass "Committed"
  fi

  info "Pushing to $REMOTE..."
  git push origin main
  pass "Pushed to origin/main"
else
  info "Skipping git push (run with --push flag to include)"
fi

# ── Summary ───────────────────────────────────────────────────────────────────
echo ""
echo -e "${BOLD}╔════════════════════════════════════════╗${NC}"
echo -e "${GREEN}${BOLD}║   All checks passed — ready to ship!  ║${NC}"
echo -e "${BOLD}╚════════════════════════════════════════╝${NC}"
echo ""
echo -e "Next steps:"
echo -e "  ${CYAN}1.${NC} git remote add origin https://github.com/YOUR_USER/kanban-pro.git"
echo -e "  ${CYAN}2.${NC} bash deploy.sh --push"
echo -e "  ${CYAN}3.${NC} Import repo at https://vercel.com/new"
echo -e "  ${CYAN}4.${NC} Add env vars in Vercel dashboard (see DEPLOYMENT_CHECKLIST.md)"
echo ""
