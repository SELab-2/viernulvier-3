"""
Tests for src/worker/sync/store/media.py
"""

from unittest.mock import MagicMock, patch
from src.config import settings
from src.worker.sync.store.media import (
    _pick_crop_url,
    _download_image,
    sync_media_for_production,
    sync_all_media,
)


# --- _pick_crop_url ---


def test_pick_crop_url_prefers_hd_ready():
    item = {
        "crops": [
            {"name": "cms", "url": "http://example.com/cms.jpg"},
            {"name": "hd_ready", "url": "http://example.com/hd.jpg"},
            {"name": "banner", "url": "http://example.com/banner.jpg"},
        ]
    }
    assert _pick_crop_url(item) == "http://example.com/hd.jpg"


def test_pick_crop_url_falls_back_to_first():
    item = {
        "crops": [
            {"name": "cms", "url": "http://example.com/cms.jpg"},
            {"name": "banner", "url": "http://example.com/banner.jpg"},
        ]
    }
    assert _pick_crop_url(item) == "http://example.com/cms.jpg"


def test_pick_crop_url_no_crops_returns_none():
    assert _pick_crop_url({"crops": []}) is None
    assert _pick_crop_url({}) is None


# --- _download_image ---


def test_download_image_success():
    fake_data = b"fake image bytes"

    with patch("urllib.request.urlopen") as mock_urlopen:
        mock_response = MagicMock()
        mock_response.read.return_value = fake_data
        mock_response.__enter__ = lambda s: s
        mock_response.__exit__ = MagicMock(return_value=False)
        mock_urlopen.return_value = mock_response

        result = _download_image("http://example.com/img.jpg")

    assert result == fake_data


def test_download_image_network_error_returns_none():
    from urllib.error import URLError

    with patch("urllib.request.urlopen", side_effect=URLError("timeout")):
        result = _download_image("http://example.com/img.jpg")

    assert result is None


# --- sync_media_for_production ---


def make_item(vnv_id: int, filename: str = "photo.jpg") -> dict:
    return {
        "@id": f"/api/v1/media/items/{vnv_id}",
        "format": "image/jpeg",
        "original_filename": filename,
        "crops": [
            {"name": "hd_ready", "url": f"http://img.vnv.gent/{vnv_id}.jpg"},
        ],
    }


def test_sync_media_skips_already_synced(db_session):
    from src.models.production import Production
    from src.models.media import Media

    # Create required Production first
    prod = Production(id=1)
    db_session.add(prod)
    db_session.flush()

    db_session.add(
        Media(
            production_id=1,
            object_key="gallery-1/existing.jpg",
            content_type="image/jpeg",
            vnv_item_id=42,
        )
    )
    db_session.commit()

    gallery = {"items": [make_item(42)]}

    with patch("src.worker.sync.store.media.get_minio_client") as mock_minio:
        sync_media_for_production(db_session, production_db_id=1, gallery=gallery)
        assert mock_minio.call_count == 1


def test_sync_media_skips_item_with_no_crops(db_session):
    gallery = {
        "items": [
            {
                "@id": "/api/v1/media/items/99",
                "format": "image/jpeg",
                "original_filename": "x.jpg",
                "crops": [],
            }
        ]
    }

    with patch("src.worker.sync.store.media.get_minio_client") as mock_minio:
        sync_media_for_production(db_session, production_db_id=1, gallery=gallery)
        assert mock_minio.call_count == 1


def test_sync_media_skips_on_download_failure(db_session):
    gallery = {"items": [make_item(10)]}

    with patch("src.worker.sync.store.media.get_minio_client"):
        with patch("src.worker.sync.store.media._download_image", return_value=None):
            sync_media_for_production(db_session, production_db_id=1, gallery=gallery)

    from src.models.media import Media

    assert db_session.query(Media).count() == 0


def test_sync_media_stores_image_and_metadata(db_session):
    from src.models.production import Production
    from src.models.media import Media

    prod = Production(id=5)
    db_session.add(prod)
    db_session.flush()

    gallery = {"items": [make_item(77)]}

    mock_minio = MagicMock()

    with patch("src.worker.sync.store.media.get_minio_client", return_value=mock_minio):
        with patch(
            "src.worker.sync.store.media._download_image", return_value=b"imgdata"
        ):
            # ADD THIS MOCK
            with patch(
                "src.worker.sync.store.media._already_synced", return_value=False
            ):
                sync_media_for_production(
                    db_session, production_db_id=5, gallery=gallery
                )

    mock_minio.put_object.assert_called_once()
    args, _ = mock_minio.put_object.call_args
    assert args[0] == settings.MINIO_BUCKET
    object_key = args[1]
    assert object_key.startswith("gallery-5/")
    assert object_key.endswith(".jpg")

    # Now flush/commit sees the row
    db_session.flush()
    media_rows = db_session.query(Media).all()
    assert len(media_rows) == 1
    assert media_rows[0].vnv_item_id == 77
    assert media_rows[0].production_id == 5
    assert media_rows[0].content_type == "image/jpeg"


def test_sync_media_skips_on_minio_error(db_session):
    from src.models.media import Media
    from minio.error import S3Error

    gallery = {"items": [make_item(55)]}

    mock_minio = MagicMock()
    mock_minio.put_object.side_effect = S3Error(
        "InternalError", "oops", "url", "rid", "bid", MagicMock()
    )

    with patch("src.worker.sync.store.media.get_minio_client", return_value=mock_minio):
        with patch("src.worker.sync.store.media._download_image", return_value=b"data"):
            sync_media_for_production(db_session, production_db_id=1, gallery=gallery)

    assert db_session.query(Media).count() == 0


# --- sync_all_media ---


def test_sync_all_media_fetches_for_prods_without_media(db_session):
    from src.models.production import Production

    prod = Production(viernulvier_id=200)
    db_session.add(prod)
    db_session.commit()

    gallery_response = {"media_gallery": {"items": [make_item(101)]}}

    mock_wrapper = MagicMock()
    mock_wrapper.GET.return_value = gallery_response

    with patch(
        "src.worker.sync.store.media.get_minio_client", return_value=MagicMock()
    ):
        with patch(
            "src.worker.sync.store.media._download_image", return_value=b"bytes"
        ):
            sync_all_media(db_session, mock_wrapper)

    mock_wrapper.GET.assert_called_once_with("/productions/200")

    from src.models.media import Media

    assert db_session.query(Media).count() == 1


def test_sync_all_media_skips_prods_with_existing_media(db_session):
    from src.models.production import Production
    from src.models.media import Media

    prod = Production(viernulvier_id=300)
    db_session.add(prod)
    db_session.flush()

    db_session.add(
        Media(
            production_id=prod.id,
            object_key="gallery-1/already.jpg",
            content_type="image/jpeg",
            vnv_item_id=999,
        )
    )
    db_session.commit()

    mock_wrapper = MagicMock()
    sync_all_media(db_session, mock_wrapper)

    mock_wrapper.GET.assert_not_called()


def test_sync_all_media_handles_missing_gallery(db_session):
    from src.models.production import Production

    prod = Production(viernulvier_id=400)
    db_session.add(prod)
    db_session.commit()

    mock_wrapper = MagicMock()
    mock_wrapper.GET.return_value = {}  # no media_gallery key

    sync_all_media(db_session, mock_wrapper)

    from src.models.media import Media

    assert db_session.query(Media).count() == 0
