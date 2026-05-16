import logging
from copy import deepcopy
from datetime import datetime

from sqlalchemy import select
from sqlalchemy.orm import Session
from src.models.tag import Tag, TagName
from src.worker.sync.store.genre import store_new_genres
from src.worker.sync.update.genre import store_updated_genres

BASE_GENRE = {
    "@id": "/api/v1/genres/22",
    "@type": "Genres",
    "created_at": "2023-03-31T08:44:07+00:00",
    "updated_at": "2026-03-31T08:25:44+00:00",
    "name": {"nl": "in De Vooruit", "en": "at De Vooruit"},
}


# No _add_normal_genre() helper because this is too simple code


def test_store_updated_genre_normal(db_session: Session, caplog):
    caplog.set_level(logging.INFO)
    store_new_genres(db_session, [BASE_GENRE])
    db_session.commit()

    updated_genre = deepcopy(BASE_GENRE)
    updated_genre["name"]["nl"] = "Groen water!"

    timestamp = store_updated_genres(db_session, [updated_genre])
    db_session.commit()
    assert timestamp == datetime.fromisoformat("2026-03-31T08:25:44+00:00")

    db_genres = db_session.scalars(select(Tag)).all()
    assert len(db_genres) == 1

    db_genre: Tag = db_genres[0]

    # Check that all fields are as expected
    assert db_genre.viernulvier_id == 22
    assert len(db_genre.names) == 2

    db_genre_names: dict[str, TagName] = {
        tagname.language: tagname for tagname in db_genre.names
    }

    assert "nl" in db_genre_names
    assert db_genre_names["nl"].name == "Groen water!"
    assert db_genre_names["en"].name == "at De Vooruit"

    # Check the logs
    infos = [r.message for r in caplog.records if r.levelno == logging.INFO]
    assert len(infos) == 1
    assert infos[0] == (
        "[UPDATE] tag_name for lang='nl' changed from 'in De Vooruit' to "
        "'Groen water!' for Tag(viernulvier_id=22)"
    )


def test_store_updated_genre_new_translation(db_session: Session, caplog):
    caplog.set_level(logging.INFO)
    initial_genre = deepcopy(BASE_GENRE)
    del initial_genre["name"]["en"]
    store_new_genres(db_session, [initial_genre])
    db_session.commit()

    updated_genre = deepcopy(BASE_GENRE)
    updated_genre["name"]["en"] = "Look a new name"

    timestamp = store_updated_genres(db_session, [updated_genre])
    db_session.commit()
    assert timestamp is not None

    db_genres = db_session.scalars(select(Tag)).all()
    assert len(db_genres) == 1

    db_genre: Tag = db_genres[0]

    # Check that all fields are as expected
    assert db_genre.viernulvier_id == 22
    assert len(db_genre.names) == 2

    db_genre_names: dict[str, TagName] = {
        tagname.language: tagname for tagname in db_genre.names
    }

    assert "nl" in db_genre_names
    assert db_genre_names["nl"].name == "in De Vooruit"
    assert db_genre_names["en"].name == "Look a new name"

    # Check the logs
    infos = [r.message for r in caplog.records if r.levelno == logging.INFO]
    assert len(infos) == 1
    assert infos[0] == (
        "[UPDATE] Adding translation lang='en', name='Look a new name' "
        "to Tag(viernulvier_id=22)"
    )


def test_store_updated_genre_unknown_genre(db_session: Session, caplog):
    caplog.set_level(logging.INFO)

    # Don't store genres as we want to let it fail because it does not know
    # the genre

    updated_genre = deepcopy(BASE_GENRE)
    timestamp = store_updated_genres(db_session, [updated_genre])
    db_session.commit()
    assert timestamp is None

    # Nothing stored
    assert len(db_session.scalars(select(Tag)).all()) == 0

    # No logs issued
    assert len([r.message for r in caplog.records]) == 0


def test_store_updated_genre_general_error(db_session: Session, caplog):
    caplog.set_level(logging.ERROR)

    updated_genre = deepcopy(BASE_GENRE)
    updated_genre["@id"] = "well this is not a valid id isn't it?"
    timestamp = store_updated_genres(db_session, [updated_genre])
    db_session.commit()
    assert timestamp is None

    errors = [r.message for r in caplog.records if r.levelno == logging.ERROR]
    assert len(errors) == 1
    assert errors[0].startswith("Error updating genre (")
