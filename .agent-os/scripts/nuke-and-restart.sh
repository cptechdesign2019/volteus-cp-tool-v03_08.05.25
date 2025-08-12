#!/usr/bin/env bash
# ------------------------------------------------------------
# nuke-and-restart.sh - Universal Nuclear option for stuck dev servers
# ------------------------------------------------------------
# This script handles EVERY possible stuck server scenario:
# - Running servers
# - Suspended servers (Ctrl+Z)
# - Zombie processes
# - Port conflicts
# - Orphaned node processes
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

cd "$PROJECT_DIR" || { echo "❌ Project directory not found"; exit 1; }

echo "🔥 NUCLEAR RESET: Killing ALL dev servers and related processes"

# ====== PHASE 1: Kill by process name patterns ======
echo "🎯 Phase 1: Killing by process patterns..."
pkill -9 -f "next dev" 2>/dev/null || true
pkill -9 -f "node.*next" 2>/dev/null || true
pkill -9 -f "npm run dev" 2>/dev/null || true
pkill -9 -f "tailwind.*watch" 2>/dev/null || true
pkill -9 -f "tail.*dev.log" 2>/dev/null || true

# ====== PHASE 2: Kill anything using our port ======
echo "🎯 Phase 2: Killing anything on port $PORT..."
lsof -ti:$PORT 2>/dev/null | xargs -r kill -9 2>/dev/null || true

# Also check with ss command (more reliable for some cases)
ss -tulnp | grep ":$PORT " | sed 's/.*pid=\([0-9]*\).*/\1/' | xargs -r kill -9 2>/dev/null || true

# ====== PHASE 3: Kill any remaining Node processes in our project ======
echo "🎯 Phase 3: Cleaning up Node processes in project directory..."
pgrep -f "$PROJECT_DIR" 2>/dev/null | xargs -r kill -9 2>/dev/null || true

# ====== PHASE 4: Aggressive port cleanup ======
echo "⏳ Aggressive port cleanup..."
sleep 2

# Try multiple times to clear the port
for i in {1..5}; do
    # Check with both lsof and ss for thorough detection
    LSOF_CHECK=$(lsof -i:$PORT 2>/dev/null || echo "")
    SS_CHECK=$(ss -tulnp | grep ":$PORT " || echo "")
    
    if [ -z "$LSOF_CHECK" ] && [ -z "$SS_CHECK" ]; then
        echo "✅ Port $PORT is free"
        break
    fi
    
    echo "🔥 Attempt $i: Force-killing port $PORT users..."
    lsof -ti:$PORT 2>/dev/null | xargs -r kill -9 2>/dev/null || true
    ss -tulnp | grep ":$PORT " | sed 's/.*pid=\([0-9]*\).*/\1/' | xargs -r kill -9 2>/dev/null || true
    
    # Try even more aggressive cleanup
    fuser -k $PORT/tcp 2>/dev/null || true
    
    sleep 2
    
    if [ $i -eq 5 ]; then
        echo "⚠️  Final attempt: Showing all port $PORT users..."
        echo "lsof results:" && lsof -i:$PORT 2>/dev/null || echo "None"
        echo "ss results:" && ss -tulnp | grep ":$PORT " || echo "None"
        
        # Last resort: wait longer
        echo "🔄 Waiting longer for port release..."
        sleep 5
    fi
done

# ====== PHASE 5: Clean up log files and temp data ======
echo "🧹 Cleaning up logs and temp files..."
rm -f dev.log nohup.out .next/trace 2>/dev/null || true

# ====== PHASE 6: Verify everything is dead ======
echo "🔍 Verification phase..."
REMAINING=$(pgrep -f "next dev" 2>/dev/null | wc -l)
if [ "$REMAINING" -gt 0 ]; then
    echo "⚠️  Warning: $REMAINING processes still found, final cleanup..."
    pgrep -f "next dev" | xargs -r kill -9
fi

# ====== PHASE 7: Start fresh server ======
echo "🚀 Starting fresh dev server..."
export TERM_ROLE=server
printf '\033]0;%s | %s\007' "$(basename "$PROJECT_DIR")" "$TERM_ROLE"

# Remove any TURBOPACK env variable to force webpack
sed -i '/^TURBOPACK=/d' .env.local 2>/dev/null || true

echo "✅ All processes killed, port $PORT is free"
echo "🎬 Starting new server in 3 seconds..."
sleep 3

nohup npm run dev --silent > dev.log 2>&1 &
SERVER_PID=$!

echo "⏳ New server starting (PID $SERVER_PID)..."

# Wait for "Ready" with timeout
TIMEOUT=30
ELAPSED=0
READY_MSG="Ready in"

while [ $ELAPSED -lt $TIMEOUT ]; do
    if grep -q "$READY_MSG" dev.log 2>/dev/null; then
        echo "✅ Server ready → http://localhost:$PORT"
        echo "📊 Use 's' to check status, 'l' for logs, 'lf' for live logs"
        exit 0
    fi
    sleep 1
    ELAPSED=$((ELAPSED + 1))
done

echo "⚠️  Server didn't start within $TIMEOUT seconds. Check logs:"
tail -10 dev.log 2>/dev/null || echo "No logs found"