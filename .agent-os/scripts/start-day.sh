#!/usr/bin/env bash
# ------------------------------------------------------------
# start-day.sh  —  Universal Daily bootstrap for Agent OS projects
# ------------------------------------------------------------
# 1. Sets terminal title (project-name | server)
# 2. Ensures TURBOPACK=0 safety flag
# 3. Runs `npm install` if node_modules missing
# 4. Restarts Next.js dev server (webpack) in background
# 5. Waits until "Ready" then prints URL
# 6. Optionally opens a new "editor" tab if cursor-terminal CLI exists
#
# UNIVERSAL DESIGN: Auto-detects project directory and port
# ------------------------------------------------------------
set -e

# Auto-detect project directory (current working directory)
PROJECT_DIR="$(pwd)"

# Auto-detect port from package.json dev script
if [[ -f "package.json" ]]; then
    PORT=$(grep -o '"dev":[^,]*--port [0-9]*' package.json | grep -o '[0-9]*$' || echo "3000")
else
    PORT=3000
fi

echo "🎯 Auto-detected: PROJECT_DIR=$PROJECT_DIR"
echo "🎯 Auto-detected: PORT=$PORT"

cd "$PROJECT_DIR" || { echo "❌ Project directory not found: $PROJECT_DIR"; exit 1; }

# ----- Set terminal role & title -----
export TERM_ROLE=server
printf '\033]0;%s | %s\007' "$(basename "$PROJECT_DIR")" "$TERM_ROLE"

# ----- Remove any TURBOPACK env var (forces webpack) -----
if [ -f .env.local ]; then
  if grep -q '^TURBOPACK=' .env.local; then
    sed -i '/^TURBOPACK=/d' .env.local
    echo "🧹 Removed TURBOPACK variable from .env.local (webpack mode)"
  fi
fi

# ----- Install dependencies if needed -----
if [ ! -d node_modules ]; then
  echo "📦 node_modules missing – running npm install (this may take a minute) …"
  npm install --silent
fi

# ----- Stop any existing Next.js dev servers & stale log tails -----
pkill -f "next dev" 2>/dev/null || true          # kill any dev server on any port
pkill -f "tail -F dev.log" 2>/dev/null || true   # kill prior log tail if running

# ----- Start server in background -----
nohup npm run dev --silent > dev.log 2>&1 &
SERVER_PID=$!

echo "⏳ Starting dev server (PID $SERVER_PID) … log → dev.log"

# ----- Wait until "Ready" appears in log -----
READY_MSG="Ready in"
( tail -F dev.log & ) | while read -r line; do
  if [[ "$line" == *"$READY_MSG"* ]]; then
    echo "✔ Dev server ready → http://localhost:$PORT"
    pkill -P $$ tail
    break
  fi
done

# ----- Open an editor tab if `cursor-terminal` CLI exists -----
if command -v cursor-terminal >/dev/null 2>&1; then
  cursor-terminal new-tab --title "$(basename "$PROJECT_DIR") | editor" --command "cd $PROJECT_DIR"
fi

echo "🎉 Environment ready.  Use 'npm run dev:status' to check server status."
