"""
Viernulvier Archief API — entrypoint.
"""

from fastapi import Depends, FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import text
from sqlalchemy.orm import Session
from src.config import settings
from src.database import get_db

app = FastAPI(
    title=settings.APP_TITLE,
    version=settings.API_VERSION,
    root_path="/api",
)

# app.add_middleware(
#     CORSMiddleware,
#     allow_origins=settings.CORS_ORIGINS,
#     allow_credentials=True,
#     allow_methods=["*"],
#     allow_headers=["*"],
# )


@app.get("/health")
def health_check() -> dict:
    return {"status": "ok"}


@app.get("/health/db")
def db_health_check(db: Session = Depends(get_db)) -> dict:
    try:
        db.execute(text("SELECT 1"))
        return {"status": "ok", "database": "connected"}
    except Exception as exc:
        return {"status": "error", "database": str(exc)}
