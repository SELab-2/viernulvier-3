"""
Viernulvier Archief API — entrypoint.
"""

from contextlib import asynccontextmanager

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from minio import Minio
from src.api.exceptions import NotFoundError, ValidationError
from src.api.v1.router import api_router
from src.config import settings


@asynccontextmanager
async def lifespan(app: FastAPI):
    import os

    if os.getenv("TESTING"):  # Skip MinIO in tests
        yield
        return

    client = Minio(
        settings.MINIO_ENDPOINT,
        access_key=settings.MINIO_ROOT_USER,
        secret_key=settings.MINIO_ROOT_PASSWORD,
        secure=False,
    )

    if not client.bucket_exists(settings.MINIO_BUCKET):
        client.make_bucket(settings.MINIO_BUCKET)
        policy = (
            '{"Version":"2012-10-17","Statement":[{"Effect":"Allow",'
            '"Principal":{"AWS":["*"]},"Action":["s3:GetObject"],'
            '"Resource":["arn:aws:s3:::' + settings.MINIO_BUCKET + '/*"]}]}'
        )
        client.set_bucket_policy(settings.MINIO_BUCKET, policy)
    yield


app = FastAPI(
    title=settings.APP_TITLE,
    version=settings.API_VERSION,
    root_path="/api",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(api_router, prefix="/v1")


@app.exception_handler(NotFoundError)
async def not_found_handler(request: Request, exc: NotFoundError):
    return JSONResponse(status_code=404, content={"detail": str(exc)})


@app.exception_handler(ValidationError)
async def validation_handler(request: Request, exc: ValidationError):
    return JSONResponse(status_code=400, content={"detail": str(exc)})
