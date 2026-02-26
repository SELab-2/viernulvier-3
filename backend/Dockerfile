FROM python:3.14.3-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

ENV PYTHONPATH=/app

CMD python init_db.py && uvicorn src.main:app --host 0.0.0.0 --port 8000
