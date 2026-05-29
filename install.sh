#!/usr/bin/env bash
set -euo pipefail
REPO_URL="https://github.com/nenifix/motiahq.git"
INSTALL_DIR="$HOME/Desktop/motiahq"
BIN_DEST="$HOME/.local/bin/motiahq"
MOTIAHQ_HOME="$HOME/.motiahq"
MOTIAHQ_LIB="$HOME/.local/lib/motiahq"
echo ""; echo "  motiahq installer - Developed by nenifix.com"; echo ""
if [ -f "$(dirname "$0")/bin/motiahq" ]; then
  INSTALL_DIR="$(cd "$(dirname "$0")" && pwd)"
  echo "  [local] Installing from: $INSTALL_DIR"
else
  echo "  [github] Cloning..."
  [ -d "$INSTALL_DIR" ] && cd "$INSTALL_DIR" && git pull || git clone "$REPO_URL" "$INSTALL_DIR"
fi
echo ""; echo "  Checking deps..."
for dep in node npm curl; do command -v "$dep" &>/dev/null && echo "    OK $dep" || { echo "    MISSING $dep"; exit 1; }; done
NODE_MAJOR=$(node -e "process.stdout.write(String(process.versions.node.split('.')[0]))" 2>/dev/null || echo "0")
[ "$NODE_MAJOR" -ge 18 ] || { echo "  Need Node >= 18"; exit 1; }
echo ""; echo "  Installing deps..."; cd "$INSTALL_DIR"; npm install --production 2>/dev/null; echo "    OK"
echo "  Installing binary..."; mkdir -p "$(dirname "$BIN_DEST")"; cp "$INSTALL_DIR/bin/motiahq" "$BIN_DEST"; chmod +x "$BIN_DEST"; echo "    OK $BIN_DEST"
echo "  Installing server..."; mkdir -p "$MOTIAHQ_LIB"; cp -r "$INSTALL_DIR/src" "$MOTIAHQ_LIB/"; cp -r "$INSTALL_DIR/node_modules" "$MOTIAHQ_LIB/" 2>/dev/null || true; cp "$INSTALL_DIR/package.json" "$MOTIAHQ_LIB/"; echo "    OK"
if [[ ":$PATH:" != *":$HOME/.local/bin:"* ]]; then
  RC="$HOME/.bashrc"; [ -f "$HOME/.bash_profile" ] && RC="$HOME/.bash_profile"
  grep -q '.local/bin' "$RC" 2>/dev/null || echo 'export PATH="$HOME/.local/bin:$PATH"' >> "$RC"
  echo "    OK Added ~/.local/bin to PATH"; export PATH="$HOME/.local/bin:$PATH"
else echo "    OK ~/.local/bin in PATH"; fi
echo ""; echo "  Configuring..."
mkdir -p "$MOTIAHQ_HOME"
if [ ! -f "$MOTIAHQ_HOME/.env" ]; then
  echo 'OPENROUTER_API_KEY=change_me' > "$MOTIAHQ_HOME/.env"
  echo 'OPENROUTER_MODEL=qwen/qwen2.5-coder-7b-instruct' >> "$MOTIAHQ_HOME/.env"
  echo 'GITHUB_TOKEN=change_me' >> "$MOTIAHQ_HOME/.env"
  echo 'MOTIAHQ_PORT=8770' >> "$MOTIAHQ_HOME/.env"
  echo "    OK Created $MOTIAHQ_HOME/.env"
else echo "    OK $MOTIAHQ_HOME/.env exists"; fi
echo ""; echo "  Workers:"; N=0
command -v motia &>/dev/null && echo "    OK motia" && N=$((N+1)) || echo "    MISSING motia"
command -v motiahene &>/dev/null && echo "    OK motiahene" && N=$((N+1)) || echo "    MISSING motiahene"
echo ""; echo "  OK motiahq installed. Developed by nenifix.com"
echo "  Run: motiahq serve | motiahq --help | motiahq --uninstall"
echo "  Dashboard: http://localhost:8770  Workers: ${N}/2"; echo ""
