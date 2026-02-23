
from fastapi import FastAPI

from api.v1.archive import global_router


app = FastAPI(
    title="VierNulVier-Archief-API",
    version="0.1.0",
)

app.include_router(global_router)

