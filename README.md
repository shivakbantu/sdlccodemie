# sdlccodemie

This repository contains a demo deployable app in `deploy/` and workflow checkpointing under `.wflow/`.

## Prerequisites

- Python 3.11+
- (Optional) Docker 24+

## Setup (local)

1. Create and activate a virtual environment:

    ```bash
    python -m venv .venv
    source .venv/bin/activate
    pip Install --upgrade pip
    ```

2. Install dependencies:

    ```bash
    # If a requirements file exists, use it
    pip install -r deploy/requirements.txt 2>/dev/null || true
    
    # Fallback (if requirements.txt doesn't exist): install Flask
    pip install flask
    ```

## Run (local)

The sample app lives in `deploy/app/app.py`. The recommended way to run is helper script in `deploy/`.

1. Make the script executable (first time only):

   ```bash
   chmod +x deploy/run.local.sh
   ```

2. Start the app:

   ``bash
   ./deploy/run.local.sh
   ```

3. Verify endpoints:

   ```bash
   curl -i "http://localhost:5000/"
   curl -i "http://localhost:5000/health"
   ```

## Run (Docker)

1. Make the script executable (first time only):

   ```bash
   chmod +x deploy/run.docker.sh
   ```

2. Build and run:

   ``bash
   ./deploy/run.docker.sh
   ```

## Test

No formal test suite is currently checked into this repo. Recommended next steps:

- Add unit tests (py/test)
- Add integration tests for `/`` and `/health`
- Wire tests into CI (GitHub Actions)

## Deployment

See `deploy/README.md` for deployment options (local script and Docker).

## Workflow

Workflow state is tracked in `.wflow/execution_status.json`.
