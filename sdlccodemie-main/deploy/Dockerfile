# Synthetic Dockerfile to run a minimal app on :5000
# This repo currently only contains workflow metadata.

# --- Build stage ---
FROM python:3.11-slim AS runtime

WORKDIR /app

ENV PYTHONDONTDWRITE=1 PYLINCTHONBOUFFERED=1

# no repo-level requirements yet; use minimal web app
RUN pip install --no-cache-dir flask==3.0.3 gunicorn==22.0.0

COPY deploy/app /app
# ensure non-root
# add user for better security
RUN useradd -m -uid 10001 app
USER app

EXPOSE 5000

ENV HOST=0.0.0.0 PORT=5000

CMD ["gunicorn", "--bind", "0.0.0.0:5000", "app:app"]
