#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────────
#  Airport Management System – Full Stack Launcher
#  Starts: C++ binary (via FastAPI) + React frontend
# ─────────────────────────────────────────────────────────────

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BACKEND_DIR="$SCRIPT_DIR/backend"
FRONTEND_DIR="$SCRIPT_DIR/frontend"

GREEN='\033[0;32m'
CYAN='\033[0;36m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${CYAN}╔══════════════════════════════════════════╗${NC}"
echo -e "${CYAN}║   Airport Management System – Launcher   ║${NC}"
echo -e "${CYAN}╚══════════════════════════════════════════╝${NC}\n"

# ── 1. Install Python deps ─────────────────────────────────
echo -e "${YELLOW}[1/4] Installing Python dependencies...${NC}"
pip install -r "$BACKEND_DIR/requirements.txt" -q

# ── 2. Install Node deps ───────────────────────────────────
echo -e "${YELLOW}[2/4] Installing Node dependencies...${NC}"
cd "$FRONTEND_DIR"
npm install -q

# ── 3. Start FastAPI backend ───────────────────────────────
echo -e "${YELLOW}[3/4] Starting FastAPI backend on :8000...${NC}"
cd "$BACKEND_DIR"
uvicorn main:app --host 0.0.0.0 --port 8000 --reload &
BACKEND_PID=$!
echo -e "${GREEN}  Backend PID: $BACKEND_PID${NC}"
sleep 2

# ── 4. Start Vite frontend ─────────────────────────────────
echo -e "${YELLOW}[4/4] Starting React frontend on :5173...${NC}"
cd "$FRONTEND_DIR"
npm run dev &
FRONTEND_PID=$!

echo -e "\n${GREEN}✓ All services started!${NC}"
echo -e "  Frontend : ${CYAN}http://localhost:5173${NC}"
echo -e "  Backend  : ${CYAN}http://localhost:8000${NC}"
echo -e "  API Docs : ${CYAN}http://localhost:8000/docs${NC}\n"
echo -e "Press Ctrl+C to stop all services.\n"

# Trap Ctrl+C to kill both processes
trap "echo 'Stopping...'; kill $BACKEND_PID $FRONTEND_PID 2>/dev/null; exit 0" INT
wait
