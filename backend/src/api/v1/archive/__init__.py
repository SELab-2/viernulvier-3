from fastapi import APIRouter
from src.api.v1.archive import events, productions, tags

router = APIRouter()

router.include_router(events.router, prefix="/events", tags=["Events"])

router.include_router(productions.router, prefix="/productions", tags=["Productions"])

router.include_router(
    tags.router,
    prefix="/tags",
    tags=["Tags"]
)

