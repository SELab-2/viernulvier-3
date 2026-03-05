"""
Viernulvier Archief API — entrypoint.
"""

from fastapi import FastAPI

# from fastapi.middleware.cors import CORSMiddleware
from src.api.v1.router import api_router
from src.config import settings

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

app.include_router(api_router, prefix="/v1")
