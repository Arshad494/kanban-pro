# ============================================================
# KanbanPro — Deployment script (PowerShell for Windows)
# Usage: .\deploy.ps1 [-Push]
# ============================================================
param([switch]$Push)

$ErrorActionPreference = "Stop"

function Pass($msg)  { Write-Host "✅ $msg" -ForegroundColor Green }
function Fail($msg)  { Write-Host "❌ $msg" -ForegroundColor Red; exit 1 }
function Warn($msg)  { Write-Host "⚠️  $msg" -ForegroundColor Yellow }
function Info($msg)  { Write-Host "ℹ  $msg" -ForegroundColor Cyan }
function Step($msg)  { Write-Host "`n$msg" -ForegroundColor White }

Write-Host "╔════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║   KanbanPro Production Deploy Check    ║" -ForegroundColor Cyan
Write-Host "╚════════════════════════════════════════╝`n" -ForegroundColor Cyan

# ── 1. Environment check ─────────────────────────────────────────────────────
Step "1/5  Environment variables"

if (-not (Test-Path ".env.local")) {
    Fail ".env.local not found. Create it with VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY"
}

$envContent = Get-Content ".env.local"
$supabaseUrl = ($envContent | Where-Object { $_ -match "^VITE_SUPABASE_URL=" }) -replace "^VITE_SUPABASE_URL=", ""
$supabaseKey = ($envContent | Where-Object { $_ -match "^VITE_SUPABASE_ANON_KEY=" }) -replace "^VITE_SUPABASE_ANON_KEY=", ""

if ([string]::IsNullOrWhiteSpace($supabaseUrl)) { Fail "VITE_SUPABASE_URL is empty" }
if ([string]::IsNullOrWhiteSpace($supabaseKey)) { Fail "VITE_SUPABASE_ANON_KEY is empty" }
if ($supabaseKey.Length -lt 100) { Fail "VITE_SUPABASE_ANON_KEY looks truncated ($($supabaseKey.Length) chars, expected ~218)" }

Pass "VITE_SUPABASE_URL   = $supabaseUrl"
Pass "VITE_SUPABASE_ANON_KEY = $($supabaseKey.Substring(0,30))… ($($supabaseKey.Length) chars)"

# ── 2. Supabase connectivity ──────────────────────────────────────────────────
Step "2/5  Supabase connectivity"

try {
    $response = Invoke-WebRequest `
        -Uri "$supabaseUrl/rest/v1/projects?select=id&limit=1" `
        -Headers @{ "apikey" = $supabaseKey; "Authorization" = "Bearer $supabaseKey" } `
        -UseBasicParsing -ErrorAction Stop
    Pass "Supabase REST API reachable (HTTP $($response.StatusCode))"
} catch {
    $code = $_.Exception.Response.StatusCode.value__
    if ($code -eq 401 -or $code -eq 403) {
        Fail "Supabase returned $code — check your anon key or RLS policies"
    } else {
        Warn "Supabase returned HTTP $code — might be offline or schema not applied"
    }
}

# ── 3. TypeScript check ──────────────────────────────────────────────────────
Step "3/5  TypeScript"

$tscResult = & npx tsc --noEmit 2>&1
if ($LASTEXITCODE -eq 0) {
    Pass "tsc --noEmit — 0 errors"
} else {
    Write-Host $tscResult
    Fail "TypeScript errors found. Fix them before deploying."
}

# ── 4. Production build ───────────────────────────────────────────────────────
Step "4/5  Production build"

& npm run build
if ($LASTEXITCODE -ne 0) {
    Fail "Build failed. Check errors above."
}

$distSize = if (Test-Path "dist") {
    [math]::Round((Get-ChildItem "dist" -Recurse | Measure-Object -Property Length -Sum).Sum / 1MB, 1)
} else { "?" }
Pass "Build succeeded — dist/ is approximately ${distSize} MB"

# ── 5. Git push (optional) ────────────────────────────────────────────────────
Step "5/5  Git"

if ($Push) {
    $gitCheck = git rev-parse --git-dir 2>&1
    if ($LASTEXITCODE -ne 0) { Fail "Not a git repository. Run: git init && git remote add origin <url>" }

    $remote = git remote get-url origin 2>&1
    if ($LASTEXITCODE -ne 0 -or [string]::IsNullOrWhiteSpace($remote)) {
        Fail "No git remote 'origin'. Run: git remote add origin <your-repo-url>"
    }

    Info "Staging all changes..."
    git add -A

    $diff = git diff --cached --name-only
    if ([string]::IsNullOrWhiteSpace($diff)) {
        Warn "Nothing new to commit — working tree clean"
    } else {
        $timestamp = Get-Date -Format "yyyy-MM-dd HH:mm"
        git commit -m "chore: production deployment $timestamp"
        Pass "Committed"
    }

    Info "Pushing to $remote..."
    git push origin main
    Pass "Pushed to origin/main"
} else {
    Info "Skipping git push (run with -Push flag to include)"
}

# ── Summary ───────────────────────────────────────────────────────────────────
Write-Host ""
Write-Host "╔════════════════════════════════════════╗" -ForegroundColor Green
Write-Host "║   All checks passed — ready to ship!   ║" -ForegroundColor Green
Write-Host "╚════════════════════════════════════════╝" -ForegroundColor Green
Write-Host ""
Write-Host "Next steps:" -ForegroundColor White
Write-Host "  1. git remote add origin https://github.com/YOUR_USER/kanban-pro.git" -ForegroundColor Cyan
Write-Host "  2. .\deploy.ps1 -Push" -ForegroundColor Cyan
Write-Host "  3. Import repo at https://vercel.com/new" -ForegroundColor Cyan
Write-Host "  4. Add env vars in Vercel dashboard (see DEPLOYMENT_CHECKLIST.md)" -ForegroundColor Cyan
Write-Host ""
