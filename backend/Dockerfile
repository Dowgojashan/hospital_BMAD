FROM python:3.11-slim

ENV PYTHONUNBUFFERED=1
WORKDIR /app

# Install build deps
RUN apt-get update \
  && apt-get install -y --no-install-recommends gcc libpq-dev build-essential curl \
  && rm -rf /var/lib/apt/lists/*

# Create a non-root user for running the app
RUN useradd --create-home --shell /bin/bash appuser

# Copy requirements if present (recommended)
COPY backend/requirements.txt /app/requirements.txt
RUN pip install --upgrade pip setuptools wheel \
  && if [ -f /app/requirements.txt ]; then pip install -r /app/requirements.txt; fi

# Copy source (in dev we'll mount the local folder to /app)
COPY backend /app
RUN chown -R appuser:appuser /app

USER appuser

EXPOSE 8000

# Default command for development (uvicorn with reload)
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000", "--reload"]
