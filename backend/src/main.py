
from fastapi import FastAPI

from routers.events import router as events_router
from routers.productions import router as production_router

app = FastAPI(
    title="VierNulVier-Archief-API",
    version="0.1.0",
)

app.include_router(events_router)
app.include_router(production_router)
