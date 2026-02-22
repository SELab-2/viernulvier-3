"""
Viernulvier Archief API — entrypoint.
"""

from fastapi import FastAPI

from routers import events, productions


app = FastAPI(
    title=settings.APP_TITLE,
    version=settings.API_VERSION,
    root_path="/api",
)

app.include_router(events.router)
app.include_router(productions.router)
