import logging
from copy import deepcopy
from datetime import datetime

from sqlalchemy import select
from sqlalchemy.orm import Session
from src.models.production import Production, ProdInfo
from src.models.tag import Tag
from src.worker.sync.store.production import store_new_productions
from src.worker.sync.update.production import store_updated_productions

BASE_PROD = {
    "@id": "/api/v1/productions/5604",
    "created_at": "2022-11-22T11:02:27+00:00",
    "updated_at": "2022-11-30T08:59:20+00:00",
    "performer_type": "group",
    "attendance_mode": "offline",
    "title": {"nl": "Poplife - NYE", "en": "Poplife - NYE"},
    "description": {"nl": "SHORT TEST DESCRIPTION"},
}


def test_store_updated_production_normal(db_session: Session, caplog):
    caplog.set_level(logging.INFO)
    store_new_productions(db_session, [BASE_PROD])
    db_session.commit()

    updated_prod = deepcopy(BASE_PROD)
    updated_prod["performer_type"] = "solo"

    timestamp = store_updated_productions(db_session, [updated_prod])
    db_session.commit()
    assert timestamp == datetime.fromisoformat("2022-11-30T08:59:20+00:00")

    db_prods = db_session.scalars(select(Production)).all()
    assert len(db_prods) == 1
    db_prod: Production = db_prods[0]

    # Check that the normal fields are as expected
    assert db_prod.viernulvier_id == 5604
    assert db_prod.performer_type == "solo"  # This one was updated
    assert db_prod.attendance_mode == "offline"

    # Check that the tags are still good
    assert len(db_prod.tags) == 0

    # Check that the infos are still good
    # 2 because of the title having 2 languages!
    assert len(db_prod.info) == 2
    prod_infos: [str, ProdInfo] = {info.language: info for info in db_prod.info}
    assert "nl" in prod_infos
    assert "en" in prod_infos

    infos = [r.message for r in caplog.records if r.levelno == logging.INFO]
    assert len(infos) == 1
    assert infos[0] == (
        "[UPDATE] performer_type changed from 'group' to 'solo' for "
        "Production(viernulvier_id=5604)"
    )


def test_store_updated_production_add_info(db_session: Session, caplog):
    caplog.set_level(logging.INFO)
    base_prod = deepcopy(BASE_PROD)
    del base_prod["title"]["en"]
    store_new_productions(db_session, [base_prod])
    db_session.commit()

    # Check that there is only a single info at this moment
    assert len(db_session.scalars(select(ProdInfo)).all()) == 1

    # Add the english title back
    updated_prod = deepcopy(BASE_PROD)
    timestamp = store_updated_productions(db_session, [updated_prod])
    assert timestamp is not None
    db_session.commit()

    # Check that there are two info's now
    assert len(db_session.scalars(select(ProdInfo)).all()) == 2

    # Check that the addition was logged
    infos = [r.message for r in caplog.records if r.levelno == logging.INFO]
    assert len(infos) == 1
    assert infos[0] == (
        "[UPDATE] adding new translation for language=en to "
        "Production(viernulvier_id=5604)"
    )


def test_store_updated_production_update_info(db_session: Session, caplog):
    caplog.set_level(logging.INFO)
    store_new_productions(db_session, [BASE_PROD])
    db_session.commit()

    # Update dutch title and add an english description
    updated_prod = deepcopy(BASE_PROD)
    updated_prod["title"]["nl"] = "Regen titel"  # yes it was raining
    updated_prod["description"]["en"] = "it was raining cats and dogs"

    timestamp = store_updated_productions(db_session, [updated_prod])
    assert timestamp is not None
    db_session.commit()

    # Get the production and check that the fields are updated
    _db_prods = db_session.scalars(select(Production)).all()
    assert len(_db_prods) == 1
    db_prod: Production = _db_prods[0]

    assert len(db_prod.info) == 2
    prod_infos: [str, ProdInfo] = {info.language: info for info in db_prod.info}

    assert prod_infos["nl"].title == "Regen titel"
    assert prod_infos["en"].title == "Poplife - NYE"
    assert prod_infos["nl"].description == "SHORT TEST DESCRIPTION"
    assert prod_infos["en"].description == "it was raining cats and dogs"

    # Check that the addition was logged
    infos = [r.message for r in caplog.records if r.levelno == logging.INFO]
    assert len(infos) == 2

    assert (
        "[UPDATE] title changed from 'Poplife - NYE' to 'Regen titel' "
        "for language=nl of Production(viernulvier_id=5604)"
    ) in infos
    assert (
        "[UPDATE] description changed from 'None' to 'it was raining cats and dogs' "
        "for language=en of Production(viernulvier_id=5604)"
    ) in infos


def test_store_updated_production_tags(db_session: Session, caplog):
    caplog.set_level(logging.INFO)

    # Create tags with id's 2, 3, 4, 5, 6, 7
    tags = [Tag(viernulvier_id=i) for i in range(2, 8)]
    db_session.add_all(tags)
    db_session.commit()

    # Create production with tags with id's 4, 5, 6, 7
    base_prod = deepcopy(BASE_PROD)
    base_prod["genres"] = [
        f"/api/v1/genres/{tag.viernulvier_id}"
        for tag in tags
        if tag.viernulvier_id >= 4
    ]
    store_new_productions(db_session, [base_prod])
    db_session.commit()

    # Create updated production with tags with id's 2, 3, 4, 5
    # to have some new tags, some staying the same, and some to be deleted
    updated_prod = deepcopy(BASE_PROD)
    updated_prod["genres"] = [
        f"/api/v1/genres/{tag.viernulvier_id}"
        for tag in tags
        if tag.viernulvier_id <= 5
    ]
    timestamp = store_updated_productions(db_session, [updated_prod])
    db_session.commit()
    assert timestamp is not None

    # Check that the tags are present
    _db_prods = db_session.scalars(select(Production)).all()
    assert len(_db_prods) == 1
    db_prod: Production = _db_prods[0]

    expected_tags = {2, 3, 4, 5}
    assert len(db_prod.tags) == len(expected_tags)
    assert {tag.viernulvier_id for tag in db_prod.tags} == expected_tags

    # Check that the diffs were logged correctly
    infos = [r.message for r in caplog.records if r.levelno == logging.INFO]
    assert len(infos) == 2

    assert (
        "[UPDATE] removing tags (viernulvier_ids=[6, 7])"
        "for Production(viernulvier_id=5604)"
    ) in infos
    assert (
        "[UPDATE] adding tags (viernulvier_ids=[2, 3])"
        "to Production(viernulvier_id=5604)"
    ) in infos


def test_store_updated_production_tags_invalid_tag(db_session: Session, caplog):
    caplog.set_level(logging.INFO)

    # Create tags with id's 2, 3, 4
    tags = [Tag(viernulvier_id=i) for i in range(2, 5)]
    db_session.add_all(tags)
    db_session.commit()

    # Create production with one of those tags
    base_prod = deepcopy(BASE_PROD)
    base_prod["genres"] = ["/api/v1/genres/2"]
    store_new_productions(db_session, [base_prod])
    db_session.commit()

    # Create updated production with all the tags and an invalid one
    updated_prod = deepcopy(BASE_PROD)
    updated_prod["genres"] = [f"/api/v1/genres/{tag.viernulvier_id}" for tag in tags]
    updated_prod["genres"].append("/api/v1/genres/404")
    timestamp = store_updated_productions(db_session, [updated_prod])
    db_session.commit()
    assert timestamp is not None

    # Check that the existin tags are present
    _db_prods = db_session.scalars(select(Production)).all()
    assert len(_db_prods) == 1
    db_prod: Production = _db_prods[0]

    expected_tags = {2, 3, 4}
    assert len(db_prod.tags) == len(expected_tags)
    assert {tag.viernulvier_id for tag in db_prod.tags} == expected_tags

    # Check the logs that there was a warning about an invalid tag
    warnings = [r.message for r in caplog.records if r.levelno == logging.WARNING]
    assert len(warnings) == 1
    assert warnings[0] == (
        "[UPDATE] Genre(viernulvier_id=404) does not exist in the database, "
        "skipping this tag for Production(viernulvier_id=5604)"
    )

    # And a quick sanity check that there was a log about the two valid new tags
    infos = [r.message for r in caplog.records if r.levelno == logging.INFO]
    assert len(infos) == 1
    assert infos[0] == (
        "[UPDATE] adding tags (viernulvier_ids=[3, 4])"
        "to Production(viernulvier_id=5604)"
    )


def test_store_updated_productions_unknown_production(db_session: Session, caplog):
    caplog.set_level(logging.INFO)

    # Not storing a base prod as we want to check whether it will correctly
    # ignore the updated prod if it was not in our database

    updated_prod = deepcopy(BASE_PROD)
    timestamp = store_updated_productions(db_session, [updated_prod])
    assert timestamp is None
    db_session.commit()

    assert len(db_session.scalars(select(Production)).all()) == 0
    assert len([r.message for r in caplog.records]) == 0


def test_store_updated_productions_general_error(db_session: Session, caplog):
    caplog.set_level(logging.INFO)

    updated_prod = deepcopy(BASE_PROD)
    updated_prod["@id"] = "horloge-oplader"
    timestamp = store_updated_productions(db_session, [updated_prod])
    db_session.commit()
    assert timestamp is None

    errors = [r.message for r in caplog.records if r.levelno == logging.ERROR]
    assert len(errors) == 1
    assert errors[0].startswith("Error updating production ")
