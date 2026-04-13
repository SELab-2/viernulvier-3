from datetime import datetime
from src.worker.converters.production import api_prod_to_model_prod
from src.worker.converters.event import api_event_to_model_event
from src.worker.converters.eventprice import api_eventprice_to_model_eventprice
from src.worker.converters.genres import api_genre_to_model_tag
from src.services.language import Languages


# Test normal test case from the actual API
def test_api_prod_to_model_prod():
    test_input = {
        "@id": "/api/v1/productions/5604",
        "@type": "StandardProduction",
        "created_at": "2022-11-22T11:02:27+00:00",
        "updated_at": "2022-11-30T08:59:20+00:00",
        "vendor_id": "7647827457-1646229457",
        "performer_type": "group",
        "attendance_mode": "offline",
        "supertitle": {"nl": "Nasty Mondays"},
        "title": {"nl": "Poplife - NYE", "en": "Poplife - NYE"},
        "artist": {"nl": ""},
        "description": {
            "nl": "<p>Ghent's longest running new year's event is proud to "
            "announce its comeback.</p>\r\n<p>A colorful carnival, "
            "for open-minded people, with amazing dj's, lots of confetti and "
            "other fun stuff, in the coolest venue ever!</p>\r\n"
        },
        "info": {
            "nl": '<p><img src="https://www.viernulvier.gent/cms_files/Image/Nastymonday_6-55bf5bcav1_site_icon.png" alt="" width="100" height="100" /></p>'
        },
        "genres": [
            "/api/v1/genres/10",
            "/api/v1/genres/12",
        ],
        "events": ["/api/v1/events/8370"],
        "media_gallery": "/api/v1/media/galleries/10365",
        "uitdatabank_keywords": [],
    }

    prod, tags = api_prod_to_model_prod(test_input)
    prod_infos = prod.info

    assert tags == [10, 12]

    # Check prod
    assert prod.viernulvier_id == 5604
    assert prod.performer_type == "group"
    assert prod.attendance_mode == "offline"

    # Check that fields that are set by our DB are not set
    assert prod.id is None
    assert prod.created_at is None
    assert prod.updated_at is None

    # Check prod_infos

    # Two info's, one per language
    assert len(prod_infos) == 2
    assert any(prod_info.language == Languages.NEDERLANDS for prod_info in prod_infos)
    assert any(prod_info.language == Languages.ENGLISH for prod_info in prod_infos)

    # Extract the info's to more easily test them
    info_nl = [pi for pi in prod_infos if pi.language == Languages.NEDERLANDS][0]
    info_en = [pi for pi in prod_infos if pi.language == Languages.ENGLISH][0]

    # Production_id should point to our DB productions, but those are not set
    # by the converters
    assert info_nl.production_id is None
    assert info_en.production_id is None

    assert info_nl.title == test_input["title"][Languages.NEDERLANDS]
    assert info_nl.supertitle == test_input["supertitle"][Languages.NEDERLANDS]
    assert info_nl.artist == test_input["artist"][Languages.NEDERLANDS]
    assert info_nl.tagline is None
    assert info_nl.teaser is None
    assert info_nl.description == test_input["description"][Languages.NEDERLANDS]
    assert info_nl.info == test_input["info"][Languages.NEDERLANDS]

    assert info_en.title == test_input["title"][Languages.ENGLISH]
    assert info_en.supertitle is None
    assert info_en.artist is None
    assert info_en.tagline is None
    assert info_en.teaser is None
    assert info_en.description is None
    assert info_en.info is None


# Test unknown language -> should not produce a lang-info for that language
def test_api_prod_to_model_prod_unknown_language():
    test_input = {
        "@id": "/api/v1/productions/5604",
        "performer_type": "group",
        "attendance_mode": "offline",
        "title": {"es": "Poplife - NYE", "en": "Poplife - NYE"},
    }

    prod, tags = api_prod_to_model_prod(test_input)
    prod_infos = prod.info

    assert tags == []
    assert len(prod_infos) == 1

    pi = prod_infos[0]

    assert pi.language == Languages.ENGLISH


# Test normal test case from the actual API
def test_api_event_to_model_event():
    test_input = {
        "@id": "/api/v1/events/6169",
        "@type": "Event",
        "created_at": "2021-08-16T14:36:53+00:00",
        "updated_at": "2025-09-16T07:33:34+00:00",
        "starts_at": "2021-11-26T19:00:00+00:00",
        "ends_at": "2021-11-26T20:00:00+00:00",
        "box_office_id": "38041",
        "vendor_id": "7798755585-1614774749",
        "max_tickets_per_order": 0,
        "uitdatabank_id": "db510b44-5657-4d5a-bbdd-2bc6c56272ea",
        "secure": False,
        "sms_verification": False,
        "production": {
            "@type": "StandardProduction",
            "@id": "/api/v1/productions/4129",
        },
        "status": "/api/v1/events/statuses/1",
        "hall": "/api/v1/halls/18",
        "prices": ["/api/v1/events/prices/6329", "/api/v1/events/prices/6331"],
        "external_order_url": {
            "nl": "https://apps.ticketmatic.com/widgets/vooruit/flow/tickets?event=450768526525&l=nl",
            "en": "https://apps.ticketmatic.com/widgets/vooruit/flow/tickets?event=450768526525&l=en",
        },
    }

    event, prod_id = api_event_to_model_event(test_input)

    assert event.viernulvier_id == 6169
    assert event.starts_at == datetime.fromisoformat(test_input["starts_at"])
    assert event.ends_at == datetime.fromisoformat(test_input["ends_at"])
    assert event.order_url == test_input["external_order_url"][Languages.NEDERLANDS]

    assert prod_id == 4129

    assert event.id is None
    assert event.production_id is None
    assert event.created_at is None
    assert event.updated_at is None


# Test events without production id should just return None because at that
# point all hope is lost forever.
def test_api_event_to_none():
    test_input1 = {"@id": "/api/v1/events/6464"}

    event, prod_id = api_event_to_model_event(test_input1)

    assert event is not None
    assert event.viernulvier_id == 6464
    assert prod_id is None

    test_input2 = {
        "@id": "/api/v1/events/6464",
        "production": {},
    }

    event, prod_id = api_event_to_model_event(test_input2)

    assert event is not None
    assert event.viernulvier_id == 6464
    assert prod_id is None


# Test normal test case from the actual API
def test_api_eventprice_to_model_eventprice():
    test_input = {
        "@id": "/api/v1/events/prices/14103",
        "@type": "EventPrice",
        "created_at": "2023-01-20T10:27:33+00:00",
        "updated_at": "2023-04-04T10:42:05+00:00",
        "available": 66,
        "amount": "15.00",
        "box_office_id": "270107",
        "contingent_id": 38128,
        "expires_at": "2023-04-04T11:07:05+00:00",
        "event": "/api/v1/events/8385",
        "price": "/api/v1/prices/73",
        "rank": "/api/v1/prices/ranks/13",
    }

    eventprice, event_id = api_eventprice_to_model_eventprice(test_input)

    assert eventprice.viernulvier_id == 14103
    assert abs(eventprice.amount - 15.00) < 0.001  # Floats :)
    assert eventprice.available == test_input["available"]
    assert eventprice.expires_at == datetime.fromisoformat(test_input["expires_at"])

    assert event_id == 8385

    assert eventprice.id is None
    assert eventprice.event_id is None
    assert eventprice.created_at is None
    assert eventprice.updated_at is None


# Test eventprices without event should just return None
def test_api_eventprice_to_none():
    test_input = {"@id": "/api/v1/events/prices/6464"}

    eventprice, event_id = api_eventprice_to_model_eventprice(test_input)

    assert eventprice is not None
    assert eventprice.viernulvier_id == 6464
    assert event_id is None


# Test normal test case from the actual API
def test_api_genre_to_model_tag():
    test_input = {
        "@id": "/api/v1/genres/100",
        "@type": "Genres",
        "created_at": "2023-03-31T12:29:23+00:00",
        "updated_at": "2025-12-04T12:15:34+00:00",
        "type": "theater",
        "use_as": "tag",
        "vendor_id": "Met voeltoer",
        "name": {"nl": "Met voeltoer", "en": "With feeling tour"},
        "slug": {"nl": "Met voeltoer"},
    }

    tag, tag_names = api_genre_to_model_tag(test_input)

    assert tag.viernulvier_id == 100
    assert len(tag_names) == 2

    tagname_nl = [tn for tn in tag_names if tn.language == Languages.NEDERLANDS][0]
    tagname_en = [tn for tn in tag_names if tn.language == Languages.ENGLISH][0]

    assert tagname_nl.name == "Met voeltoer"
    assert tagname_en.name == "With feeling tour"

    assert len(tag.productions) == 0


# Test fallback test case from the actual API
def test_api_genre_to_model_tag_fallback():
    test_input = {
        "@id": "/api/v1/genres/1",
        "@type": "Genres",
        "created_at": "2008-07-11T08:49:18+00:00",
        "updated_at": "2025-12-04T12:15:37+00:00",
        "type": "theater",
        "use_as": "genre",
        "vendor_id": "cabaret",
    }

    tag, tag_names = api_genre_to_model_tag(test_input)

    assert tag.viernulvier_id == 1
    assert len(tag_names) == 1

    tagname_nl = [tn for tn in tag_names if tn.language == Languages.NEDERLANDS][0]

    assert tagname_nl.name == "cabaret"

    assert len(tag.productions) == 0


# Test tags without name should just return an empty list
def test_api_genre_to_none():
    test_input = {"@id": "/api/v1/genres/7"}

    tag, tag_names = api_genre_to_model_tag(test_input)

    assert tag is not None
    assert tag.viernulvier_id == 7
    assert len(tag_names) == 0
