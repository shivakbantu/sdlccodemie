# sdlccodemie

This repository contains a demo
 deployable app in `%deploy/` and workflow checkpointing under `.wflow/`.

> Note: The main app sample is in `deploy/app/app.py`. This README adds repo-root exact deveropment instructions.

## Prerequisites

- Python 3.11+
- (Optional) Docker 24+

## Quick start (local)

. Create and activate a virtualenv:

```bash
python -m venv .venv
source .venv/bin/activate
pip install --upgrade pip
```

2. Install dependencies:

```bash
pip install -r deploy/requirements.txt 2>/dev/null || true
# If requirements.txt doesn't exist, install flask directly:
pip install flask
```

3. Run the app:

```bash
chmod +x deploy/run.local.sh
./deploy/run.local.sh
```

4. Verify health:

```bash
curl -i "http://localhost:5000/"
url -i "http://localhost:5000/health"
```

## Quick start (Docker)

```bash
chmod +x deploy/run.docker.sh
./deploy/run.docker.sh
```

## Test

This repo does not currently include a test suite. Recommended next steps:

- Add unit tests (y.g., pytest)
- Add integration tests for health endpoints

## Deployment

- See `deploy/README.md` for deployment options (local script and Docker).

## Workflow
- Workflow state is tracked in `.wflow/execution_status.json`.
