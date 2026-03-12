FROM python:3.14.3-slim AS base
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PYTHONPATH=/app \
    PATH="/opt/venv/bin:$PATH"
WORKDIR /app

FROM base AS builder
RUN python -m venv /opt/venv

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

FROM builder AS test
COPY requirements-dev.txt .
RUN pip install --no-cache-dir -r requirements-dev.txt

COPY src/ ./src/
COPY tests/ ./tests/
COPY init_db.py .

CMD ["sh", "-c", "python init_db.py && uvicorn src.main:app --host 0.0.0.0 --port 8000"]

FROM base AS final
RUN addgroup --system appgroup && adduser --system --group appuser

COPY --from=builder /opt/venv /opt/venv

COPY --chown=appuser:appgroup src/ ./src/
COPY --chown=appuser:appgroup init_db.py .

USER appuser
EXPOSE 8000
CMD ["sh", "-c", "python init_db.py && uvicorn src.main:app --host 0.0.0.0 --port 8000"]