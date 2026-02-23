"""
Viernulvier Archief API — entrypoint.
"""

from fastapi import FastAPI

from api.v1.archive import global_archive_router
from api.v1.auth import global_auth_router

app = FastAPI(
    title=settings.APP_TITLE,
    version=settings.API_VERSION,
    root_path="/api",
)

app.include_router(global_archive_router)
app.include_router(global_auth_router)


