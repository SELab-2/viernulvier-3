from fastapi import APIRouter
import events
import productions

global_archive_router = APIRouter()


global_archive_router.include_router(
    events.router,
    prefix="/events",
    tags=["Events"]
)

global_archive_router.include_router(
    productions.router,
    prefix="/productions",
    tags=["Productions"]
)