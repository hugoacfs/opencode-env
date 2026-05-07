#!/usr/bin/env bash

set -e

show_help() {
    echo "=========================================="
    echo "  OpenCode + SearXNG Ultimate Manager"
    echo "=========================================="
    echo "Usage: ./setup.sh [OPTIONS]"
    echo "  (none)  Boot environment, install Node 20, and apply CSP Hacker Fix"
    echo "  -t      Tear down the environment (Containers only)"
    echo "  -c      Clean Tear Down (Nukes containers AND volumes)"
    echo "  -r      Restart OpenCode container"
    echo "  -l      Tail SearXNG logs"
    echo "  -h      Show this help menu"
    echo "=========================================="
}

while getopts "tcrlh" opt; do
    case ${opt} in
        t ) echo "🛑 Tearing down..."; docker compose down; exit 0 ;;
        c ) echo "🔥 Nuking environment..."; docker compose down -v; exit 0 ;;
        r ) echo "🔄 Restarting OpenCode..."; docker compose restart opencode-env; exit 0 ;;
        l ) echo "📡 Tailing logs..."; docker compose logs -f searxng; exit 0 ;;
        h ) show_help; exit 0 ;;
        \? ) show_help; exit 1 ;;
    esac
done

echo "1. Booting up Docker Compose..."
docker compose up -d

echo "2. Waiting 3 seconds for OpenCode to stabilize..."
sleep 3

echo "3. Checking Node/NPM installation..."
if docker compose exec opencode-env command -v npm >/dev/null 2>&1; then
    echo "✅ NPM is already installed."
else
    echo "⚠️ NPM missing! Force-installing official Node v20 & NPM..."
    # 1. Install curl
    # 2. Add NodeSource v20 repository (this provides node AND npm)
    # 3. Install the package
    docker compose exec --user root opencode-env sh -c "apt-get update && apt-get install -y curl && curl -fsSL https://deb.nodesource.com/setup_20.x | bash - && apt-get install -y nodejs"
    echo "✅ Node & NPM successfully installed!"
    
    # Needs a restart to register paths
    docker compose restart opencode-env
    sleep 3
fi

echo "=========================================="
echo "🚀 Setup & Hacks Complete!"
echo "OpenCode is ready at: http://localhost:4096"
echo "=========================================="
