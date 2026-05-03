"""
Fetches images from a VNV production gallery and stores them in Minio,
creating a Media row per image exactly as the upload endpoint would.
"""

import io
import logging
import os
import urllib.request
import uuid
from urllib.error import URLError

from minio.error import S3Error
from sqlalchemy import select, func
from sqlalchemy.orm import Session

from src.config import settings
from src.models.media import Media
from src.models.production import Production
from src.services.media import get_minio_client


logger = logging.getLogger(__name__)

PREFERRED_CROP = "hd_ready"


def _pick_crop_url(item: dict) -> str | None:
    crops: list[dict] = item.get("crops", [])
    if not crops:
        return None
    for crop in crops:
        if crop.get("name") == PREFERRED_CROP:
            return crop["url"]
    return crops[0]["url"]


def _download_image(url: str) -> bytes | None:
    try:
        with urllib.request.urlopen(url, timeout=30) as response:
            return response.read()
    except URLError as e:
        logger.warning(f"Failed to download image from {url}: {e}")
        return None


def _already_synced(db_session: Session, vnv_item_id: int) -> bool:
    return db_session.execute(
        select(Media).where(Media.vnv_item_id == vnv_item_id)
    ).scalar_one_or_none() is not None


def sync_media_for_production(
    db_session: Session,
    production_db_id: int,
    gallery: dict,
) -> None:
    items: list[dict] = gallery.get("items", [])
    if not items:
        return

    logger.info(f"Syncing {len(items)} image(s) for production id={production_db_id}")
    minio_client = get_minio_client()

    for item in items:
        vnv_item_id = int(item["@id"].split("/")[-1])

        if _already_synced(db_session, vnv_item_id):
            logger.debug(f"  item vnv_id={vnv_item_id}: already synced, skipping")
            continue

        crop_url = _pick_crop_url(item)
        if not crop_url:
            logger.warning(f"  item vnv_id={vnv_item_id}: no crops, skipping")
            continue

        content_type: str = item.get("format", "image/jpeg")
        ext = os.path.splitext(item.get("original_filename", "image.jpg"))[1].lower() or ".jpg"
        object_key = f"gallery-{production_db_id}/{uuid.uuid4()}{ext}"

        image_bytes = _download_image(crop_url)
        if image_bytes is None:
            continue

        try:
            minio_client.put_object(
                settings.MINIO_BUCKET,
                object_key,
                io.BytesIO(image_bytes),
                length=len(image_bytes),
                content_type=content_type,
            )
        except S3Error as e:
            logger.error(f"  item vnv_id={vnv_item_id}: Minio upload failed: {e}")
            continue

        db_session.add(Media(
            production_id=production_db_id,
            object_key=object_key,
            content_type=content_type,
            vnv_item_id=vnv_item_id,
        ))
        logger.info(f"  item vnv_id={vnv_item_id}: stored as {object_key}")


def sync_all_media(db_session: Session, wrapper) -> None:
    """
    Fetch and store media for all productions that have no media yet.
    Runs as a separate sync step after productions are fully stored.
    """
    # Find all productions that have a viernulvier_id but no media rows yet
    prods_without_media = db_session.execute(
        select(Production)
        .outerjoin(Production.media)
        .where(
            Production.viernulvier_id.isnot(None),
            Media.id.is_(None),
        )
    ).scalars().all()

    logger.info(f"Fetching media for {len(prods_without_media)} production(s) without media")

    for prod in prods_without_media:
        try:
            gallery_data = wrapper.GET(f"/productions/{prod.viernulvier_id}")
            gallery = gallery_data.get("media_gallery")
            if not gallery or not isinstance(gallery, dict):
                logger.debug(f"Production vnv_id={prod.viernulvier_id} has no gallery, skipping")
                continue
            sync_media_for_production(
                db_session=db_session,
                production_db_id=prod.id,
                gallery=gallery,
            )
            db_session.commit()
        except Exception as e:
            logger.error(f"Failed to sync media for production vnv_id={prod.viernulvier_id}: {e}")
            db_session.rollback()