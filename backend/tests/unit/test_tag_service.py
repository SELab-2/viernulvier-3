import pytest

from src.services.tag import (
    get_tags_list,
    get_tag_by_id,
    create_tag,
    update_tag,
    delete_tag_by_id,
    get_names_for_language,
)

from src.models.tag import Tag, TagName
from src.schemas.tag import TagCreate, TagNameBase
from src.api.exceptions import NotFoundError

from src.services.language import Languages

BASE_URL = "http://test"


@pytest.fixture
def tag(db_session):
    tag = Tag()
    db_session.add(tag)
    db_session.flush()

    name_nl = TagName(tag_id=tag.id, language=Languages.NEDERLANDS, name="tag_nl")
    name_en = TagName(tag_id=tag.id, language=Languages.ENGLISH, name="tag_en")

    db_session.add_all([name_nl, name_en])
    db_session.commit()

    db_session.refresh(tag)
    return tag


def test_get_tags_list(db_session, tag):
    result = get_tags_list(db_session, BASE_URL)

    assert len(result) == 1
    assert result[0].id == f"{BASE_URL}/tags/{tag.id}"
    assert len(result[0].names) == 2


@pytest.mark.usefixtures("tag")
def test_get_tags_list_language_filter(db_session):
    result = get_tags_list(db_session, BASE_URL, Languages.NEDERLANDS)

    assert len(result) == 1
    assert len(result[0].names) == 1
    assert result[0].names[0].name == "tag_nl"


def test_get_tag_by_id_success(db_session, tag):
    result = get_tag_by_id(db_session, tag.id, BASE_URL)

    assert result.id == f"{BASE_URL}/tags/{tag.id}"
    assert len(result.names) == 2


def test_get_tag_by_id_language_filter(db_session, tag):
    result = get_tag_by_id(db_session, tag.id, BASE_URL, Languages.ENGLISH)

    assert len(result.names) == 1
    assert result.names[0].name == "tag_en"


def test_get_tag_by_id_not_found(db_session):
    with pytest.raises(NotFoundError):
        get_tag_by_id(db_session, 999, BASE_URL)


def test_create_tag(db_session):
    tag_in = TagCreate(
        names=[
            TagNameBase(language=Languages.NEDERLANDS, name="tag_nl"),
            TagNameBase(language=Languages.ENGLISH, name="tag_en"),
        ]
    )

    result = create_tag(db_session, tag_in, BASE_URL)

    assert result.id.startswith(f"{BASE_URL}/tags/")
    assert len(result.names) == 2

    names = {n.language: n.name for n in result.names}
    assert names[Languages.NEDERLANDS] == "tag_nl"
    assert names[Languages.ENGLISH] == "tag_en"


def test_update_tag_existing_and_new_language(db_session, tag):
    tag_in = TagCreate(
        names=[
            TagNameBase(language=Languages.NEDERLANDS, name="updated_nl"),
            TagNameBase(language=Languages.ENGLISH, name="new_en"),
        ]
    )

    result = update_tag(db_session, tag.id, tag_in, BASE_URL)

    assert len(result.names) == 2

    names = {n.language: n.name for n in result.names}
    assert names[Languages.NEDERLANDS] == "updated_nl"
    assert names[Languages.ENGLISH] == "new_en"


def test_update_tag_not_found(db_session):
    tag_in = TagCreate(names=[TagNameBase(language=Languages.NEDERLANDS, name="tag")])

    with pytest.raises(NotFoundError):
        update_tag(db_session, 999, tag_in, BASE_URL)


def test_delete_tag_success(db_session, tag):
    delete_tag_by_id(db_session, tag.id)


def test_delete_tag_not_found(db_session):
    with pytest.raises(NotFoundError):
        delete_tag_by_id(db_session, 999)


def test_get_names_for_language_found(tag):
    result = get_names_for_language(tag.names, Languages.NEDERLANDS)

    assert len(result) == 1
    assert result[0].name == "tag_nl"


def test_get_names_for_language_not_found(tag):
    result = get_names_for_language(tag.names, "fr")

    # fallback returns all names
    assert len(result) == 2


def test_get_names_for_language_none(tag):
    result = get_names_for_language(tag.names, None)

    assert len(result) == 2
