#!/usr/bin/env bash
# motiahq uninstaller — Agent Orchestration HQ
# Developed by nenifix.com
set -euo pipefail

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
NC='\033[0m'

MOTIAHQ_HOME="$HOME/.motiahq"
MOTIAHQ_BIN="$HOME/.local/bin/motiahq"
MOTIAHQ_LIB="$HOME/.local/lib/motiahq"
MOTIAHQ_SERVER="$HOME/.local/bin/motiahq-server.bat"
MOTIAHQ_VBS="$HOME/.local/bin/motiahq-hidden.vbs"
MOTIAHQ_CMDS=("$MOTIAHQ_BIN" "$MOTIAHQ_BIN.cmd" "$MOTIAHQ_SERVER" "$MOTIAHQ_VBS")

echo ""
echo "  motiahq uninstaller — Developed by nenifix.com"
echo ""

# Confirm
read -p "  Remove motiahq? This will delete binaries, lib, and config [y/N] " -n 1 -r
echo ""
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
  echo "  Cancelled."
  exit 0
fi

# Stop running server
if pgrep -f "motiahq" > /dev/null 2>&1; then
  echo "  Stopping running motiahq server..."
  pkill -f "motiahq" 2>/dev/null || true
  sleep 1
  echo "  ${GREEN}✓${NC} Server stopped"
fi

# Remove binaries
REMOVED=0
for f in "${MOTIAHQ_CMDS[@]}"; do
  if [ -f "$f" ]; then
    rm -f "$f"
    echo "  ${GREEN}✓${NC} Removed $f"
    REMOVED=1
  fi
done
if [ "$REMOVED" = 0 ]; then
  echo "  ${YELLOW}⚠${NC} No binaries found (already removed?)"
fi

# Remove lib directory
if [ -d "$MOTIAHQ_LIB" ]; then
  rm -rf "$MOTIAHQ_LIB"
  echo "  ${GREEN}✓${NC} Removed $MOTIAHQ_LIB"
fi

# Remove config
if [ -d "$MOTIAHQ_HOME" ]; then
  read -p "  Also remove config ($MOTIAHQ_HOME/.env)? [y/N] " -n 1 -r
  echo ""
  if [[ $REPLY =~ ^[Yy]$ ]]; then
    rm -rf "$MOTIAHQ_HOME"
    echo "  ${GREEN}✓${NC} Removed $MOTIAHQ_HOME"
  else
    echo "  ${YELLOW}⚠${NC} Kept $MOTIAHQ_HOME (contains your API keys)"
  fi
fi

# Remove temp files
for f in /tmp/motiahq.log /tmp/motiahq.pid; do
  if [ -f "$f" ]; then
    rm -f "$f"
    echo "  ${GREEN}✓${NC} Removed $f"
  fi
done

echo ""
echo "  ${GREEN}✅ motiahq uninstalled.${NC}"
echo "  Docs: https://nenifix.com/docs/motiahq"
