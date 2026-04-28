from sqlalchemy.orm import Session
from src.api.dependencies.language import get_accepted_language
from src.database import get_db
from src.schemas.blogs import (
    BlogCreate,
    BlogListResponse,
    BlogResponse,
    BlogUpdate,
)
from src.services.blogs import (
    create_blog,
    get_blog_by_id,
    get_blogs_paginated,
    update_blog_by_id,
    delete_blog_by_id,
)
from fastapi import APIRouter, Depends, Query, Request, status
from src.services.auth.permissions import Permissions
from src.api.dependencies import RequirePermissions
from src.models.user import User
from src.services.archive import get_base_url

router = APIRouter()


@router.get(
    "/",
    response_model=BlogListResponse,
    summary="Get Blogs",
    description="Get all blogs of the database, using pagination",
)
async def get_blogs(
    request: Request,
    db: Session = Depends(get_db),
    cursor: str | None = Query(None),
    limit: int = Query(20, ge=1, le=50),
) -> BlogListResponse:
    base_url = get_base_url(str(request.url))
    return get_blogs_paginated(db, base_url, cursor=cursor, limit=limit)


@router.get(
    "/{blog_id}",
    response_model=BlogResponse,
    summary="Get blog by id",
    description="Get a blog with a certain id",
)
async def get_blog(
    blog_id: int,
    request: Request,
    db: Session = Depends(get_db),
    language: str | None = Depends(get_accepted_language),
) -> BlogResponse:
    base_url = get_base_url(str(request.url), 2)
    blog_data = get_blog_by_id(db, blog_id, base_url, language)
    return blog_data


@router.post(
    "/",
    response_model=BlogResponse,
    status_code=201,
    summary="Create blog",
    description="Create a new blog in the database",
)
async def post_blog(
    blog_in: BlogCreate,
    request: Request,
    db: Session = Depends(get_db),
    _: User = Depends(RequirePermissions([Permissions.BLOG_CREATE])),
) -> BlogResponse:
    base_url = get_base_url(str(request.url))
    blog_data = create_blog(db, blog_in, base_url)
    return blog_data


@router.patch(
    "/{blog_id}",
    response_model=BlogResponse,
    summary="Update blog by id",
    description="Update a blog with a certain id",
)
async def patch_blog(
    blog_id: int,
    blog_in: BlogUpdate,
    request: Request,
    db: Session = Depends(get_db),
    _: User = Depends(RequirePermissions([Permissions.BLOG_UPDATE])),
) -> BlogResponse:
    base_url = get_base_url(str(request.url))
    blog_data = update_blog_by_id(db, blog_in, blog_id, base_url)
    return blog_data


@router.delete(
    "/{blog_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Delete blog by id",
    description="Delete a blog with a certain id",
)
async def delete_blog(
    blog_id: int,
    db: Session = Depends(get_db),
    _: User = Depends(RequirePermissions([Permissions.BLOG_DELETE])),
):
    delete_blog_by_id(db, blog_id)
