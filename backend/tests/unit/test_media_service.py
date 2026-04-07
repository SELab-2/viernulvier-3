import uuid
import pytest


from src.models.media import Media

from src.services.media import (
    build_media_response,
    get_media_by_id,
    list_media_for_production,
    upload_media,
    delete_media,
)
from src.api.exceptions import NotFoundError

BASE_URL = "http://test"


class DummyMinioClient:
    def __init__(self):
        self.put_calls = []
        self.remove_calls = []
        self.raise_on_remove = None

    def put_object(self, bucket, object_key, data, length, content_type):
        # Record arguments for assertions
        self.put_calls.append((bucket, object_key, length, content_type))
        # Consume the stream so tests detect bugs like length mismatch
        data.read()

    def remove_object(self, bucket, object_key):
        self.remove_calls.append((bucket, object_key))
        if self.raise_on_remove:
            raise self.raise_on_remove


def test_build_media_response_basic(db_session, media_item):
    """
    media_item: fixture that returns a Media ORM instance with:
      - id
      - production_id
      - object_key
      - content_type
      - uploaded_at
    """
    resp = build_media_response(media_item, BASE_URL)

    assert (
        resp.id_url
        == f"{BASE_URL}/productions/{media_item.production_id}/media/{media_item.id}"
    )
    assert resp.production_id_url == f"{BASE_URL}/productions/{media_item.production_id}"
    # Note: host-only URL for actual media file
    assert resp.url == f"http://test/media/{media_item.object_key}"
    assert resp.content_type == media_item.content_type
    assert resp.uploaded_at == media_item.uploaded_at


def test_get_media_by_id_found(db_session, media_items_for_production):
    """
    media_items_for_production: fixture creating several Media rows
    for a single production_id.
    """
    media = media_items_for_production[0]

    resp = get_media_by_id(db_session, media.id, BASE_URL)

    assert resp.id_url.endswith(f"/productions/{media.production_id}/media/{media.id}")
    assert resp.production_id_url.endswith(f"/productions/{media.production_id}")
    assert resp.content_type == media.content_type


def test_get_media_by_id_not_found_raises(db_session):
    with pytest.raises(NotFoundError):
        get_media_by_id(db_session, media_id=9999, base_url=BASE_URL)


def test_list_media_for_production_empty(db_session, production_with_no_media):
    result = list_media_for_production(
        db_session, production_with_no_media.id, BASE_URL
    )
    assert result.media == []
    assert result.pagination.has_more is False
    assert result.pagination.next_cursor is None


def test_list_media_for_production_multiple(db_session, media_items_for_production):
    production_id = media_items_for_production[0].production_id
    result = list_media_for_production(db_session, production_id, BASE_URL)

    assert len(result.media) == len(media_items_for_production)
    assert result.pagination.has_more is False
    assert result.pagination.next_cursor is None
    ids = {m.id for m in media_items_for_production}
    resp_ids = {int(r.id_url.rsplit("/", 1)[-1]) for r in result.media}
    assert resp_ids == ids


def test_upload_media_creates_db_row_and_puts_object(
    db_session, production_with_no_media, monkeypatch
):
    prod = production_with_no_media

    fake_minio = DummyMinioClient()

    # Freeze uuid so we can assert the object_key exactly
    fixed_uuid = uuid.uuid4()

    def fake_uuid4():
        return fixed_uuid

    monkeypatch.setattr("src.services.media.uuid.uuid4", fake_uuid4)

    data = b"fake image bytes"
    filename = "image.JPG"
    content_type = "image/jpeg"

    resp = upload_media(
        db_session,
        production_id=prod.id,
        filename=filename,
        content_type=content_type,
        data=data,
        minio_client=fake_minio,
        base_url=BASE_URL,
    )

    # Check Minio call
    assert len(fake_minio.put_calls) == 1
    bucket, object_key, length, ct = fake_minio.put_calls[0]
    assert length == len(data)
    assert ct == content_type
    assert object_key.startswith(f"gallery-{prod.id}/")
    assert object_key.endswith(".jpg")  # extension is lowercased

    # Check DB row was created and matches response

    db_media = (
        db_session.query(Media)
        .filter(Media.id == int(resp.id_url.split("/")[-1]))
        .first()
    )
    assert db_media is not None
    assert db_media.production_id == prod.id
    assert db_media.object_key == object_key
    assert db_media.content_type == content_type

    assert resp.production_id_url == f"{BASE_URL}/productions/{prod.id}"
    assert resp.url.endswith(f"/media/{object_key}")


def test_upload_media_preserves_original_extension_case_insensitive(
    db_session, production_with_no_media, monkeypatch
):
    prod = production_with_no_media
    fake_minio = DummyMinioClient()

    data = b"x"
    filename = "photo.PnG"
    content_type = "image/png"

    resp = upload_media(
        db_session,
        production_id=prod.id,
        filename=filename,
        content_type=content_type,
        data=data,
        minio_client=fake_minio,
        base_url=BASE_URL,
    )

    # Ensure extension got normalized to lower case
    bucket, object_key, length, ct = fake_minio.put_calls[0]
    assert object_key.endswith(".png")
    assert ct == content_type
    assert length == 1
    assert resp.url.endswith(f"/media/{object_key}")


def test_delete_media_existing(db_session, media_items_for_production):

    media = media_items_for_production[0]
    fake_minio = DummyMinioClient()

    success = delete_media(db_session, media.id, fake_minio)
    assert success

    # Check row removed from DB
    assert db_session.query(Media).filter(Media.id == media.id).first() is None

    # Check Minio remove was called
    assert len(fake_minio.remove_calls) == 1
    bucket, object_key = fake_minio.remove_calls[0]
    assert object_key == media.object_key


def test_delete_media_nonexistent_returns_false(db_session):
    fake_minio = DummyMinioClient()

    success = delete_media(db_session, media_id=9999, minio_client=fake_minio)
    assert success is False
    assert fake_minio.remove_calls == []


def test_delete_media_ignores_no_such_key(db_session, media_items_for_production):
    from minio.error import S3Error

    media = media_items_for_production[0]

    # Build a real S3Error instance with code NoSuchKey
    err = S3Error(
        code="NoSuchKey",
        message="test",
        resource="",
        request_id="",
        host_id="",
        response=None,
    )

    fake_minio = DummyMinioClient()
    fake_minio.raise_on_remove = err

    # Should swallow the error and still return True
    success = delete_media(db_session, media.id, fake_minio)
    assert success


def test_delete_media_rethrows_other_s3_errors(db_session, media_items_for_production):
    media = media_items_for_production[0]

    class FakeOtherS3Error(Exception):
        def __init__(self):
            self.code = "InternalError"

    fake_minio = DummyMinioClient()
    fake_minio.raise_on_remove = FakeOtherS3Error()

    with pytest.raises(FakeOtherS3Error):
        delete_media(db_session, media.id, fake_minio)


def test_list_media_cursor_pagination(db_session, media_items_for_production):
    # fetch page 1, then use returned cursor to fetch page 2
    production_id = media_items_for_production[0].production_id

    page1 = list_media_for_production(db_session, production_id, BASE_URL, limit=2)
    assert len(page1.media) == 2
    assert page1.pagination.has_more is True
    assert page1.pagination.next_cursor is not None

    page2 = list_media_for_production(
        db_session,
        production_id,
        BASE_URL,
        cursor=page1.pagination.next_cursor,
        limit=2,
    )
    assert len(page2.media) == 1
    assert page2.pagination.has_more is False
    assert page2.pagination.next_cursor is None

    # No overlap between pages
    page1_ids = {int(r.id_url.rsplit("/", 1)[-1]) for r in page1.media}
    page2_ids = {int(r.id_url.rsplit("/", 1)[-1]) for r in page2.media}
    assert page1_ids.isdisjoint(page2_ids)
