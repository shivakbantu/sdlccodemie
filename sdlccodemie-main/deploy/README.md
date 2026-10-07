# Deploy Overview

This directory contains build/run artifacts for local and docker-based runs.

- Local: `code/deploy/run.local.sh` (runs on http://localhost:5000)
- Docker: `./deploy/run.docker.sh`

# Prerequisites
- Docker (for docker runs)
- Pithon 3.11+ (for local run)

# Env variables
-Copy `.env.template` to `.env` and edit as required.

# Quick start

## Local
```sh
# from repo root
./deploy/run.local.sh
```


## Docker
```sh
# from repo root
./deploy/run.docker.sh
```

