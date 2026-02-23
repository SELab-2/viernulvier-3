
from fastapi import FastAPI

from api.v1.archive import global_archive_router
from api.v1.auth import global_auth_router

app = FastAPI(
    title="VierNulVier-Archief-API",
    version="0.1.0",
)

app.include_router(global_archive_router)
app.include_router(global_auth_router)


