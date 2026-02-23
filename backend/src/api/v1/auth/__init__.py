from fastapi import APIRouter
import login
import users

global_auth_router = APIRouter()


global_auth_router.include_router(
    login.router,
    prefix="/login",
    tags=["Login"]
)

global_auth_router.include_router(
    users.router,
    prefix="/users",
    tags=["Users"]
)