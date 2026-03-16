"""
Viernulvier Archief API — entrypoint.
"""

from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse
from src.api.v1.router import api_router
from src.config import settings
from src.api.exceptions import NotFoundError, ValidationError

app = FastAPI(
    title=settings.APP_TITLE,
    version=settings.API_VERSION,
    root_path="/api",
)

# app.add_middleware(
#     CORSMiddleware,
#     allow_origins=settings.CORS_ORIGINS,
#     allow_credentials=True,
#     allow_methods=["*"],
#     allow_headers=["*"],
# )

app.include_router(api_router, prefix="/v1")


@app.exception_handler(NotFoundError)
async def not_found_handler(request: Request, exc: NotFoundError):
    return JSONResponse(status_code=404, content={"detail": str(exc)})


@app.exception_handler(ValidationError)
async def validation_handler(request: Request, exc: ValidationError):
    return JSONResponse(status_code=400, content={"detail": str(exc)})
