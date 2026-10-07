#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$ROOT/.." && pwd)"

IMAGE=${IMAGE-sdlccododemie-local}
PLATFORM=${PLATFORM---platform=linux/amd64}

cd "$REPO_ROOT"

docker build $PLATFORM -t "$IMAGE" -f deploy/Dockerfile .

docker run --rm -p 5000:5000 --env-file deploy/.env.template "$IMAGE"
