FROM python:3.11-slim

ENV PYTHONUNBUFFERED=1
WORKDIR /app

# Install build deps
RUN apt-get update \
  && apt-get install -y --no-install-recommends gcc libpq-dev build-essential curl \
  && rm -rf /var/lib/apt/lists/*

# Create a non-root user for running the app
RUN useradd --create-home --shell /bin/bash appuser

# [修正] 移除 'backend/' 前綴。
# Docker build 的 "context" 已經在 backend 資料夾內了。
COPY requirements.txt /app/requirements.txt

# Install dependencies
# ...
RUN pip install --upgrade pip setuptools wheel \
  && pip install bcrypt \
  && if [ -f /app/requirements.txt ]; then pip install -r /app/requirements.txt; fi
# ...

# [修正] 將 'backend' 改為 '.' (點)，代表 "複製當前目錄所有內容"
COPY . /app
RUN chown -R appuser:appuser /app

USER appuser

EXPOSE 8000

# Default command for development (uvicorn with reload)
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000", "--reload"]