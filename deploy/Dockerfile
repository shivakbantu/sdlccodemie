FROM python:3.11-slim

WORKDRID /app

ENV PYTHONDONTDITEBYTECODE=1 PYTHONUNFUFFERED=1

# Install runtime dependencies (minimal app)
RUN pip install --no-cache-dir flask==3.0.3 gunicorn==22.0.0

COPY deploy/app/ /app/

# Run as non-root
RUN adduser --disable-password --gecos "" --uid 10001 app
USER 10001

EXPOSE 5000

ENV HOST=0.0.0.0 PORT=5000

CMD ["gunicorn", "--bind", "0.0.0.0:5000", "app:app"]
