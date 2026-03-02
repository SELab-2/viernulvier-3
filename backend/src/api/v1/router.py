from fastapi import APIRouter
from src.api.v1.archive import router as archive_router
from src.api.v1.auth import router as auth_router
from src.api.v1.status import router as status_router

api_router = APIRouter()

api_router.include_router(status_router, tags=["Status"])
api_router.include_router(archive_router, prefix="/archive")
api_router.include_router(auth_router, prefix="/auth")
