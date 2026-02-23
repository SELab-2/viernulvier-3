"""
Viernulvier Archief API — entrypoint.
"""

from fastapi import FastAPI

from api.v1.archive import global_router


app = FastAPI(
    title=settings.APP_TITLE,
    version=settings.API_VERSION,
    root_path="/api",
)

app.include_router(global_router)

