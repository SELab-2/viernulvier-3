from fastapi import APIRouter
from src.api.v1.archive import (
    events,
    productions,
    halls,
    tags,
    media,
    statistics,
    artists,
    blogs,
)


router = APIRouter()

router.include_router(events.router, prefix="/events", tags=["Events"])

router.include_router(productions.router, prefix="/productions", tags=["Productions"])

router.include_router(halls.router, prefix="/halls", tags=["Halls"])

router.include_router(tags.router, prefix="/tags", tags=["Tags"])

router.include_router(media.router, prefix="/productions", tags=["Media"])

router.include_router(statistics.router, prefix="/statistics", tags=["Statistics"])

router.include_router(artists.router, prefix="/artists", tags=["Artists"])

router.include_router(blogs.router, prefix="/blogs", tags=["Blogs"])
