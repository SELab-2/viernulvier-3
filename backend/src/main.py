
from fastapi import FastAPI

from routers import events, productions


app = FastAPI(
    title="VierNulVier-Archief-API",
    version="0.1.0",
)

app.include_router(events.router)
app.include_router(productions.router)
