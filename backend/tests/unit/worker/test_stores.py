import logging
from datetime import datetime

from sqlalchemy import select
from src.models.event import Event, EventPrice
from src.models.production import ProdInfo, Production
from src.models.tag import Tag, TagName
from src.worker.sync.store.event import store_new_events
from src.worker.sync.store.eventprice import store_new_eventprices
from src.worker.sync.store.production import store_new_productions
from src.worker.sync.store.tag import store_new_tags
from src.worker.sync.store.genre import store_new_genres


# Test storing a list of productions from the API into our database
def test_store_new_productions(db_session):
    # Data from actual API, removed some unused fields, that already gets
    # tested in 'test_converters.py'
    productions = [
        {
            "@id": "/api/v1/productions/5604",
            "created_at": "2022-11-22T11:02:27+00:00",
            "updated_at": "2022-11-30T08:59:20+00:00",
            "performer_type": "group",
            "attendance_mode": "offline",
            "title": {"nl": "Poplife - NYE", "en": "Poplife - NYE"},
            "description": {
                "nl": "<p>Ghent's longest running new year's event is proud to announce its comeback.</p>\r\n<p>A colorful carnival, for open-minded people, with amazing dj's, lots of confetti and other fun stuff, in the coolest venue ever!</p>\r\n<p>We challenge you to a dance-off into 2023 with a mix of both sexy and powerful dance tunes from R&B to disco, from house to HipHop and beyond!</p>\r\n<p>DJ LINE UP COMING SOON</p>"
            },
        },
        {
            "@id": "/api/v1/productions/5610",
            "created_at": "2022-11-22T13:45:50+00:00",
            "updated_at": "2024-07-23T06:59:29+00:00",
            "performer_type": "group",
            "attendance_mode": "offline",
            "title": {"nl": "TOESTANDEN", "en": "TOESTANDEN"},
            "description": {
                "nl": "<p>Tijdens de debatreeks <strong>TOESTANDEN </strong>gaan we in gesprek met boeiende gasten &eacute;n het publiek over zaken die ons &lsquo;s nachts wakker houden. We willen een ontmoetings- en overlegruimte cre&euml;ren voor de diverse burgers die Gent rijk is om gedachten, idee&euml;n en tools te delen. Elke editie wordt gemodereerd door de Gentse socioloog en jeugdwerker <strong>Fatih Devos</strong> en theatermaker en actrice <strong>Dominique Collet</strong>. Ze nodigen twee gasten uit om mee in gesprek te gaan.</p>\r\n<p>Dit seizoen werken we met het thema '<em><strong>Re-enchanting our world</strong></em>': het op zoek gaan naar en opnieuw toelaten van de betovering en verwondering in de wereld en onszelf. Dit thema is gekoppeld aan het festival &lsquo;<strong>WOMEN AND CHILDREN FIRST</strong>&rsquo; dat in maart 2023 doorgaat bij VIERNULVIER (binnenkort meer hierover). Elke editie van TOESTANDEN belicht een ander aspect van dit brede thema.&nbsp;</p>\r\n<p>Deze editie hebben we het over trauma's. We gaan in op de beperkingen en de kracht ervan en hoe je een trauma kan inzetten als iets positiefs om te verbinden met jezelf en met elkaar.&nbsp;</p>\r\n<p>Het boek op tafel is '<strong>Trauma Magic</strong>' van <strong>Clementine Morrigan</strong>. Te gast zijn <strong>Els Heene </strong>en <strong>Inge Lattrez</strong> van <strong>Platform-K</strong>. <strong>Helena Casella</strong> zorgt voor de muzikale intermezzo's.</p>"
            },
        },
        {
            "@id": "/api/v1/productions/5613",
            "created_at": "2022-11-22T13:45:59+00:00",
            "updated_at": "2024-07-23T06:59:30+00:00",
            "performer_type": "group",
            "attendance_mode": "offline",
            "title": {
                "nl": "20 Y Pirates Crew: Kabaka Pyramid",
                "en": "20 Y Pirates Crew: Kabaka Pyramid",
            },
            "description": {
                "nl": "<p><strong>Pirates Crew</strong>, &eacute;&eacute;n van de finest reggae soundsystems in Belgi&euml;, wordt 20 jaar! Met een mix van reggae, new roots, rub-a-dub, dancehall en allround Jamaicaanse muziek groeiden ze uit tot een begrip in de Belgische reggaescene. Ze deelden het podium met artiesten als <strong>Winston Francis</strong>, <strong>Blackout JA</strong>, <strong>Peter Spence</strong>, <strong>Collieman &amp; Saimn-I </strong>&eacute;n brachten verschillende vinylproducties uit. De 100% vinylsound van<strong> Pirates Crew</strong> zorgt gegarandeerd voor 200% vibes!</p>\r\n<p>Hun verjaardagsfeest wordt een avondvullende show met livebands, gevolgd door een knaller van een afterparty die knipoogt naar alle reggaestijlen. Als headliner nodigen ze niemand minder dan <strong>Kabaka Pyramid</strong> uit. Samen met <strong>Protoje</strong>, <strong>Tarrus Riley</strong> en <strong>Chronixx </strong>behoort Kabaka Pyramid uit Kingston, Jamaica tot d&eacute; nieuwe rootsreggae-generatie. Zijn muziek is sterk be&iuml;nvloed door artiesten als <strong>Sizzla</strong>, <strong>Peter Tosh</strong>, <strong>Nas</strong> en <strong>Common </strong>- duidelijk te horen op zijn debuut-ep &lsquo;<strong>Rebel Music</strong>&rsquo;. Kabaka Pyramid bracht onlangs zijn tweede album &lsquo;<strong>The Kalling</strong>&rsquo; uit en scoorde er meteen zijn eerste Grammy-nominatie voor 'Beste Reggae Album' mee. Op het album horen we grote namen als <strong>Damien Marley</strong>, <strong>Buju Banton</strong>, <strong>Tifa </strong>en <strong>Protoje</strong>.&nbsp;</p>\r\n<p>Een grote meneer krijgt niet &eacute;&eacute;n, maar tw&eacute;&eacute; support acts. Het Belgische <strong>Camel&rsquo;s Drop</strong> - de multivocale band rond o.m. zanger<strong> Dhazed</strong> en reggaeveteraan <strong>Far High</strong> (skyblasters) - brengt new roots met invloeden van 80&rsquo;s reggae en rub-a-dub. <strong>Dukes of Skazzard</strong> staat bekend om zijn exclusieve ska- en rocksteady-selecties.</p>\r\n<p>Afsluiten doen we met een spetterende afterparty! <strong>Cromanty</strong>, <strong>Heartbeat Movement</strong>, <strong>Pirates Crew</strong> (+ guests) en <strong>Unification</strong> zullen speciaal voor deze gelegenheid ook enkel vinylplaten draaien. Verwacht een eclectische mix van roots, reggae &amp; dancehall - kom meevieren!</p>"
            },
        },
    ]

    # Store in database
    newest = store_new_productions(db_session, productions)
    db_session.commit()

    # Check
    stored_prods: list[Production] = (
        db_session.execute(select(Production)).scalars().all()
    )
    assert len(stored_prods) == 3

    assert stored_prods[0].viernulvier_id == 5604
    assert stored_prods[1].viernulvier_id == 5610
    assert stored_prods[2].viernulvier_id == 5613

    stored_infos = db_session.execute(select(ProdInfo)).scalars().all()
    # 6 prod_info because 2 languages per production
    assert len(stored_infos) == 6

    # Check if everything is linked properly
    stored_prod_ids = [prod.id for prod in stored_prods]
    for stored_info in stored_infos:
        assert stored_info.production_id in stored_prod_ids

    # Assert newest timestamp returned
    assert newest == datetime.fromisoformat("2022-11-22T13:45:59+00:00")


# Quick sanity check that we get None when no production was received
def test_store_new_productions_empty_list(db_session):
    newest = store_new_productions(db_session, [])
    assert newest is None


# Test if events are correctly put inside our database, or not when they
# need not be added
def test_store_new_events_with_orphans(db_session, caplog):
    # Capture waring log messages to check if orphan warnings are issued
    caplog.set_level(logging.WARNING)

    # Add a dummy production to the DB so that an event can be stored
    prod = Production(viernulvier_id=4129)
    db_session.add(prod)
    db_session.commit()

    # Real data from the API, some fields removed
    events = [
        # Valid event
        {
            "@id": "/api/v1/events/6169",
            "created_at": "2021-08-16T14:36:53+00:00",
            "updated_at": "2025-09-16T07:33:34+00:00",
            "starts_at": "2021-11-26T19:00:00+00:00",
            "ends_at": "2021-11-26T20:00:00+00:00",
            "production": {
                "@type": "StandardProduction",
                "@id": "/api/v1/productions/4129",
            },
        },
        # Invalid: no production
        {
            "@id": "/api/v1/events/6171",
            "created_at": "2021-08-16T14:36:53+00:00",
            "updated_at": "2025-09-16T07:33:34+00:00",
            "starts_at": "2022-06-11T18:00:00+00:00",
            "ends_at": "2022-06-11T19:30:00+00:00",
        },
        # Invalid: production does not exist in Database
        {
            "@id": "/api/v1/events/6173",
            "created_at": "2021-08-16T14:36:55+00:00",
            "updated_at": "2025-09-16T07:33:34+00:00",
            "starts_at": "2021-12-09T14:00:00+00:00",
            "ends_at": "2021-12-09T19:25:00+00:00",
            "production": {
                "@type": "StandardProduction",
                "@id": "/api/v1/productions/4133",
            },
        },
        # Invalid: production does not exist in Database
        {
            "@id": "/api/v1/events/6175",
            "@type": "Event",
            "created_at": "2021-08-16T14:36:55+00:00",
            "updated_at": "2025-09-16T07:33:34+00:00",
            "starts_at": "2021-12-10T19:00:00+00:00",
            "ends_at": "2021-12-10T20:30:00+00:00",
            "production": {
                "@type": "StandardProduction",
                "@id": "/api/v1/productions/4135",
            },
        },
    ]

    # Try to store the events
    newest = store_new_events(db_session, events)
    db_session.commit()

    # Assert that only one event was stored
    stored_events = db_session.execute(select(Event)).scalars().all()
    assert len(stored_events) == 1
    assert stored_events[0].viernulvier_id == 6169

    # newest timestamp should be from the last created valid event
    assert newest == datetime.fromisoformat("2021-08-16T14:36:53+00:00")

    # Check the log messages for the invalid events
    warnings = [r.message for r in caplog.records if r.levelno == logging.WARNING]

    no_production_warning = warnings[0]
    orphaned_warning_1 = warnings[1]
    orphaned_warning_2 = warnings[2]
    total_orphans_warning = warnings[3]

    assert "event (id=6171)" in no_production_warning
    assert "no associated production" in no_production_warning

    assert "event (id=6173)" in orphaned_warning_1
    assert "production (id=4133)" in orphaned_warning_1
    assert "does not exist" in orphaned_warning_1

    assert "event (id=6175)" in orphaned_warning_2
    assert "production (id=4135)" in orphaned_warning_2
    assert "does not exist" in orphaned_warning_2

    assert "Skipped 3 events" in total_orphans_warning


# Quick sanity check that we get None when no event was received
def test_store_new_events_empty_list(db_session):
    newest = store_new_events(db_session, [])
    assert newest is None


# Test if eventprices are correctly put inside our database, or not when they
# need not be added
def test_store_new_eventprices_with_orphans(db_session, caplog):
    # Capture waring log messages to check if orphan warnings are issued
    caplog.set_level(logging.WARNING)

    # Add a dummy event to the DB so that an eventprice can be stored
    event = Event(viernulvier_id=8625)
    db_session.add(event)
    db_session.commit()

    # Real data from the API, some fields removed
    eventprices = [
        # Valid eventprice
        {
            "@id": "/api/v1/events/prices/14085",
            "created_at": "2023-01-20T10:26:50+00:00",
            "updated_at": "2023-03-04T11:16:07+00:00",
            "available": 0,
            "amount": "0.00",
            "event": "/api/v1/events/8625",
        },
        # Invalid: no event
        {
            "@id": "/api/v1/events/prices/14088",
            "created_at": "2023-01-20T10:26:50+00:00",
            "updated_at": "2023-03-04T11:16:07+00:00",
            "available": 0,
            "amount": "0.00",
        },
        # Invalid: event not in DB
        {
            "@id": "/api/v1/events/prices/14091",
            "created_at": "2023-01-20T10:26:50+00:00",
            "updated_at": "2023-03-04T11:16:07+00:00",
            "available": 0,
            "amount": "0.00",
            "event": "/api/v1/events/8626",
        },
        {
            "@id": "/api/v1/events/prices/14094",
            "created_at": "2023-01-20T10:27:33+00:00",
            "updated_at": "2023-04-04T10:42:05+00:00",
            "available": 66,
            "amount": "18.00",
            "event": "/api/v1/events/8385",
        },
    ]

    # Try to store the eventprices
    newest = store_new_eventprices(db_session, eventprices)
    db_session.commit()

    # Assert that only one eventprice was stored
    stored_events = db_session.execute(select(EventPrice)).scalars().all()
    assert len(stored_events) == 1
    assert stored_events[0].viernulvier_id == 14085

    # newest timestamp should be from the last created valid eventprice
    assert newest == datetime.fromisoformat("2023-01-20T10:26:50+00:00")

    # Check the log messages for the invalid eventprices
    warnings = [r.message for r in caplog.records if r.levelno == logging.WARNING]

    no_event_warning = warnings[0]
    orphaned_warning_1 = warnings[1]
    orphaned_warning_2 = warnings[2]
    total_orphans_warning = warnings[3]

    assert "eventprice (id=14088)" in no_event_warning
    assert "no associated event" in no_event_warning

    assert "eventprice (id=14091)" in orphaned_warning_1
    assert "event (id=8626)" in orphaned_warning_1
    assert "does not exist" in orphaned_warning_1

    assert "eventprice (id=14094)" in orphaned_warning_2
    assert "event (id=8385)" in orphaned_warning_2
    assert "does not exist" in orphaned_warning_2

    assert "Skipped 3 eventprices" in total_orphans_warning


def test_store_new_tags(db_session):
    # Data from actual API, removed some unused fields, that already gets
    # tested in 'test_converters.py'
    tags = [
        {
            "@id": "/api/v1/tags/6",
            "created_at": "2019-02-15T11:55:07+00:00",
            "updated_at": "2023-01-16T09:34:20+00:00",
            "name": {"nl": "Abonnee 17-18", "en": "Subscriber 17-18"},
        },
        {
            "@id": "/api/v1/tags/14",
            "created_at": "2019-02-15T11:55:07+00:00",
            "updated_at": "2023-01-16T09:34:20+00:00",
            "name": {"nl": "Regelmatige klant min 3 voorst. EP 16-17"},
        },
        {
            "@id": "/api/v1/tags/18",
            "created_at": "2019-02-15T11:55:07+00:00",
            "updated_at": "2023-01-16T09:34:20+00:00",
            "name": {"nl": "Regelmatige klant min 3 voorst. EP 15-16"},
        },
    ]

    # Store in database
    newest = store_new_tags(db_session, tags)
    db_session.commit()

    # Check
    stored_tags = db_session.execute(select(Tag)).scalars().all()
    assert len(stored_tags) == 3

    stored_names = db_session.execute(select(TagName)).scalars().all()
    # 4 because 1 tag has 2 languages for its name
    assert len(stored_names) == 4

    assert newest == datetime.fromisoformat("2019-02-15T11:55:07+00:00")


def test_store_new_genres(db_session):
    # Data from actual API, removed some unused fields, that already gets
    # tested in 'test_converters.py'
    genres = [
        {
            "@id": "/api/v1/genres/1",
            "created_at": "2008-07-11T08:49:18+00:00",
            "updated_at": "2025-12-04T12:15:37+00:00",
            "vendor_id": "cabaret"
        },
        {
            "@id": "/api/v1/genres/3",
            "created_at": "2008-07-11T08:50:34+00:00",
            "updated_at": "2025-12-04T12:15:34+00:00",
            "vendor_id": "opera"
        },
        {
            "@id": "/api/v1/genres/22",
            "@type": "Genres",
            "created_at": "2023-03-31T08:44:07+00:00",
            "updated_at": "2026-03-31T08:25:44+00:00",
            "name": {"nl": "in De Vooruit", "en": "at De Vooruit"},
        },
    ]

    # Store in database
    newest = store_new_genres(db_session, genres)
    db_session.commit()

    # Check
    stored_tags = db_session.execute(select(Tag)).scalars().all()
    assert len(stored_tags) == 3

    stored_names = db_session.execute(select(TagName)).scalars().all()
    # 4 because 1 genre has 2 languages for its name
    assert len(stored_names) == 4

    assert newest == datetime.fromisoformat("2023-03-31T08:44:07+00:00")
