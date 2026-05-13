import pytest
from unittest.mock import MagicMock
from datetime import datetime, timezone

from src.models.visual import Visual
from src.api.exceptions import NotFoundError
from src.schemas.visual import VisualType


BASE_URL = "http://testserver/api/v1/archive"


def _make_visual(
    id: int = 1,
    object_key: str = "visuals/abc.pdf",
    content_type: str = "application/pdf",
    title: str | None = "Test poster",
    description: str | None = "A test description",
    visual_type: VisualType | None = VisualType.POSTER,
) -> Visual:
    p = Visual()
    p.id = id
    p.object_key = object_key
    p.content_type = content_type
    p.title = title
    p.description = description
    p.visual_type = visual_type
    p.uploaded_at = datetime(2024, 1, 1, tzinfo=timezone.utc)
    return p


# ---------------------------------------------------------------------------
# build_visual_response
# ---------------------------------------------------------------------------


class TestBuildVisualResponse:
    def test_url_uses_host(self):
        from src.services.visual_service import build_visual_response

        p = _make_visual(object_key="visuals/xyz.pdf")
        result = build_visual_response(p, BASE_URL)

        assert result.url.endswith("xyz.pdf")
        assert "http://" in result.url

    def test_id_url(self):
        from src.services.visual_service import build_visual_response

        p = _make_visual(id=42)
        result = build_visual_response(p, BASE_URL)

        assert "/visuals/42" in result.id_url

    def test_all_fields_present(self):
        from src.services.visual_service import build_visual_response

        p = _make_visual(
            id=1,
            title="Affiche",
            description="Seizoen 2024",
            visual_type=VisualType.POSTER,
        )
        result = build_visual_response(p, BASE_URL)

        assert result.title == "Affiche"
        assert result.description == "Seizoen 2024"
        assert result.visual_type == "poster"
        assert result.content_type == "application/pdf"
        assert result.uploaded_at == datetime(2024, 1, 1, tzinfo=timezone.utc)

    def test_optional_fields_none(self):
        from src.services.visual_service import build_visual_response

        p = _make_visual(title=None, description=None, visual_type=None)
        result = build_visual_response(p, BASE_URL)

        assert result.title is None
        assert result.description is None
        assert result.visual_type is None


# ---------------------------------------------------------------------------
# get_visual_by_id
# ---------------------------------------------------------------------------


class TestGetVisualById:
    def test_returns_response(self):
        from src.services.visual_service import get_visual_by_id

        db = MagicMock()
        db.query.return_value.filter.return_value.first.return_value = _make_visual(
            id=5
        )

        result = get_visual_by_id(db, 5, BASE_URL)

        assert "/visuals/5" in result.id_url

    def test_raises_not_found(self):
        from src.services.visual_service import get_visual_by_id

        db = MagicMock()
        db.query.return_value.filter.return_value.first.return_value = None

        with pytest.raises(NotFoundError):
            get_visual_by_id(db, 999, BASE_URL)


# ---------------------------------------------------------------------------
# list_visuals
# ---------------------------------------------------------------------------


class TestListVisuals:
    def _db_with_items(self, items: list[Visual], total: int):
        db = MagicMock()
        query_mock = MagicMock()
        query_mock.filter.return_value = query_mock
        query_mock.order_by.return_value = query_mock
        query_mock.limit.return_value = query_mock
        query_mock.all.return_value = items
        query_mock.scalar.return_value = total
        db.query.return_value = query_mock
        return db

    def test_returns_all_items(self):
        from src.services.visual_service import list_visuals

        items = [_make_visual(id=i) for i in range(3)]
        db = self._db_with_items(items, 3)

        result = list_visuals(db, BASE_URL)

        assert result.pagination.total_count == 3
        assert result.pagination.has_more is False
        assert len(result.visuals) == 3

        for item in result.visuals:
            assert hasattr(item, "id_url")
            assert "/visuals/" in item.id_url

    def test_empty_list(self):
        from src.services.visual_service import list_visuals

        db = self._db_with_items([], 0)

        result = list_visuals(db, BASE_URL)

        assert result.visuals == []
        assert result.pagination.total_count == 0
        assert result.pagination.has_more is False
        assert result.pagination.next_cursor is None

    def test_has_more_when_extra_item(self):
        from src.services.visual_service import list_visuals

        items = [_make_visual(id=i) for i in range(21)]
        db = self._db_with_items(items, 50)

        result = list_visuals(db, BASE_URL, limit=20)

        assert result.pagination.has_more is True
        assert len(result.visuals) == 20

    def test_next_cursor_is_last_item_id(self):
        from src.services.visual_service import list_visuals

        items = [_make_visual(id=i) for i in range(21)]
        db = self._db_with_items(items, 50)

        result = list_visuals(db, BASE_URL, limit=20)

        assert result.pagination.next_cursor == items[19].id

    def test_no_cursor_when_no_more(self):
        from src.services.visual_service import list_visuals

        items = [_make_visual(id=i) for i in range(3)]
        db = self._db_with_items(items, 3)

        result = list_visuals(db, BASE_URL, limit=20)

        assert result.pagination.next_cursor is None

    def test_respects_max_page_size(self):
        from src.services.visual_service import list_visuals, VISUAL_MAX_PAGE_SIZE

        items = [_make_visual(id=i) for i in range(5)]
        db = self._db_with_items(items, 5)

        list_visuals(db, BASE_URL, limit=99999)

        call_args = db.query.return_value.order_by.return_value.limit.call_args
        assert call_args[0][0] <= VISUAL_MAX_PAGE_SIZE + 1


# ---------------------------------------------------------------------------
# upload_visual
# ---------------------------------------------------------------------------


class TestUploadVisual:
    def _make_db(self):
        db = MagicMock()
        db.refresh.side_effect = lambda obj: (
            setattr(obj, "id", 1)
            or setattr(obj, "uploaded_at", datetime(2024, 1, 1, tzinfo=timezone.utc))
        )
        return db

    def test_stores_in_minio_and_db(self):
        from src.services.visual_service import upload_visual

        db = self._make_db()
        minio = MagicMock()

        upload_visual(
            db=db,
            filename="affiche.pdf",
            content_type="application/pdf",
            data=b"%PDF",
            minio_client=minio,
            base_url=BASE_URL,
            title="Affiche",
            description="Seizoen 2024",
            visual_type=VisualType.POSTER,
        )

        minio.put_object.assert_called_once()
        db.add.assert_called_once()
        db.commit.assert_called_once()

    def test_object_key_format(self):
        from src.services.visual_service import upload_visual

        db = self._make_db()
        minio = MagicMock()

        upload_visual(
            db=db,
            filename="affiche.pdf",
            content_type="application/pdf",
            data=b"%PDF",
            minio_client=minio,
            base_url=BASE_URL,
        )

        object_key = minio.put_object.call_args[0][1]
        assert object_key.endswith(".pdf")

    def test_object_key_uses_uuid(self):
        from src.services.visual_service import upload_visual

        db = self._make_db()
        minio = MagicMock()

        upload_visual(
            db=db,
            filename="a.png",
            content_type="image/png",
            data=b"PNG",
            minio_client=minio,
            base_url=BASE_URL,
        )
        upload_visual(
            db=db,
            filename="b.png",
            content_type="image/png",
            data=b"PNG",
            minio_client=minio,
            base_url=BASE_URL,
        )

        keys = [call[0][1] for call in minio.put_object.call_args_list]
        assert keys[0] != keys[1]

    def test_title_and_description_stored(self):
        from src.services.visual_service import upload_visual

        db = self._make_db()
        minio = MagicMock()

        upload_visual(
            db=db,
            filename="x.pdf",
            content_type="application/pdf",
            data=b"%PDF",
            minio_client=minio,
            base_url=BASE_URL,
            title="My title",
            description="My description",
        )

        added_obj = db.add.call_args[0][0]
        assert added_obj.title == "My title"
        assert added_obj.description == "My description"

    def test_optional_fields_default_none(self):
        from src.services.visual_service import upload_visual

        db = self._make_db()
        minio = MagicMock()

        upload_visual(
            db=db,
            filename="x.pdf",
            content_type="application/pdf",
            data=b"%PDF",
            minio_client=minio,
            base_url=BASE_URL,
        )

        added_obj = db.add.call_args[0][0]
        assert added_obj.title is None
        assert added_obj.description is None
        assert added_obj.visual_type is None

    def test_uses_visuals_bucket(self):
        from src.services.visual_service import upload_visual
        from src.config import settings

        db = self._make_db()
        minio = MagicMock()

        upload_visual(
            db=db,
            filename="x.pdf",
            content_type="application/pdf",
            data=b"%PDF",
            minio_client=minio,
            base_url=BASE_URL,
        )

        bucket_used = minio.put_object.call_args[0][0]
        assert bucket_used == settings.MINIO_VISUALS_BUCKET


# ---------------------------------------------------------------------------
# delete_visual
# ---------------------------------------------------------------------------


class TestDeleteVisual:
    def test_deletes_from_minio_and_db(self):
        from src.services.visual_service import delete_visual

        db = MagicMock()
        db.query.return_value.filter.return_value.first.return_value = _make_visual(
            id=1
        )
        minio = MagicMock()

        result = delete_visual(db, 1, minio)

        assert result is True
        minio.remove_object.assert_called_once()
        db.delete.assert_called_once()
        db.commit.assert_called_once()

    def test_uses_visuals_bucket(self):
        from src.services.visual_service import delete_visual
        from src.config import settings

        db = MagicMock()
        db.query.return_value.filter.return_value.first.return_value = _make_visual(
            id=1
        )
        minio = MagicMock()

        delete_visual(db, 1, minio)

        bucket_used = minio.remove_object.call_args[0][0]
        assert bucket_used == settings.MINIO_VISUALS_BUCKET

    def test_returns_false_when_not_found(self):
        from src.services.visual_service import delete_visual

        db = MagicMock()
        db.query.return_value.filter.return_value.first.return_value = None
        minio = MagicMock()

        result = delete_visual(db, 999, minio)

        assert result is False
        minio.remove_object.assert_not_called()
        db.delete.assert_not_called()

    def test_tolerates_minio_no_such_key(self):
        from src.services.visual_service import delete_visual
        from minio.error import S3Error

        db = MagicMock()
        db.query.return_value.filter.return_value.first.return_value = _make_visual(
            id=1
        )
        minio = MagicMock()

        err = S3Error(
            code="NoSuchKey",
            message="",
            resource="",
            request_id="",
            host_id="",
            response=MagicMock(),
        )
        minio.remove_object.side_effect = err

        result = delete_visual(db, 1, minio)
        assert result is True
        db.delete.assert_called_once()

    def test_reraises_other_s3_errors(self):
        from src.services.visual_service import delete_visual
        from minio.error import S3Error

        db = MagicMock()
        db.query.return_value.filter.return_value.first.return_value = _make_visual(
            id=1
        )
        minio = MagicMock()

        err = S3Error(
            code="InternalError",
            message="",
            resource="",
            request_id="",
            host_id="",
            response=MagicMock(),
        )
        minio.remove_object.side_effect = err

        with pytest.raises(S3Error):
            delete_visual(db, 1, minio)
