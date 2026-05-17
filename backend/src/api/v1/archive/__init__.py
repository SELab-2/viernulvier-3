from fastapi import APIRouter
from src.api.v1.archive import (
    artists,
    blog_media,
    blogs,
    events,
    halls,
    history,
    prod_media,
    production_groups,
    productions,
    statistics,
    tags,
    visuals,
)

router = APIRouter()

router.include_router(events.router, prefix="/events", tags=["Events"])

router.include_router(productions.router, prefix="/productions", tags=["Productions"])

router.include_router(
    production_groups.router,
    prefix="/series",
    tags=["Series"],
)

router.include_router(halls.router, prefix="/halls", tags=["Halls"])

router.include_router(tags.router, prefix="/tags", tags=["Tags"])

router.include_router(prod_media.router, prefix="/productions", tags=["Media"])
router.include_router(blog_media.router, prefix="/blogs", tags=["Media"])

router.include_router(statistics.router, prefix="/statistics", tags=["Statistics"])

router.include_router(artists.router, prefix="/artists", tags=["Artists"])

router.include_router(blogs.router, prefix="/blogs", tags=["Blogs"])

router.include_router(history.router, prefix="/history", tags=["History"])

router.include_router(visuals.router, prefix="/visuals", tags=["Visuals"])
