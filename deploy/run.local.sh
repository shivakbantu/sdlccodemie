#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$ROOT/.." && pwd)"

VENV="$ROOT/.venv"
if [ ! -d "$VENV" ]; then
  python3 -m venv "$VENV"
fi

"$VENV/bin/pip" install --upgrade pip
"$VENV/bin/pip" install flask==3.0.3 gunicorn==22.0.0

export HOST=${HOST-0.0.0.0}
export PORT=${PORT-5000}

echo "Starting app on http://localhost:$PORT"

exec "$VENV/bin/python" "$ROOT/app/app.py"
