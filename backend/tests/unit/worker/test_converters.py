from datetime import datetime
from src.worker.converters.production import api_prod_to_model_prod
from src.worker.converters.event import api_event_to_model_event
from src.worker.converters.eventprice import api_eventprice_to_model_eventprice


LANG_MAP = {"en": 1, "nl": 2}


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
        "genres": [],
        "events": ["/api/v1/events/8370"],
        "media_gallery": "/api/v1/media/galleries/10365",
        "uitdatabank_keywords": [],
    }

    prod, prod_infos = api_prod_to_model_prod(test_input, LANG_MAP)

    # Check prod
    assert prod.id == 5604
    assert prod.performer_type == "group"
    assert prod.attendance_mode == "offline"

    assert prod.created_at is None
    assert prod.updated_at is None

    # Check prod_infos
    assert len(prod_infos) == 2

    assert any(prod_info.language_id == LANG_MAP["en"] for prod_info in prod_infos)
    assert any(prod_info.language_id == LANG_MAP["nl"] for prod_info in prod_infos)

    info_nl = [pi for pi in prod_infos if pi.language_id == LANG_MAP["nl"]][0]
    info_en = [pi for pi in prod_infos if pi.language_id == LANG_MAP["en"]][0]

    assert info_nl.production_id == prod.id
    assert info_en.production_id == prod.id

    assert info_nl.title == test_input["title"]["nl"]
    assert info_nl.supertitle == test_input["supertitle"]["nl"]
    assert info_nl.artist == test_input["artist"]["nl"]
    assert info_nl.tagline is None
    assert info_nl.teaser is None
    assert info_nl.description == test_input["description"]["nl"]
    assert info_nl.info == test_input["info"]["nl"]

    assert info_en.title == test_input["title"]["en"]
    assert info_en.supertitle is None
    assert info_en.artist is None
    assert info_en.tagline is None
    assert info_en.teaser is None
    assert info_en.description is None
    assert info_en.info is None


# Test onbekende taal -> geen prod-info
def test_api_prod_to_model_prod_unknown_language():
    test_input = {
        "@id": "/api/v1/productions/5604",
        "performer_type": "group",
        "attendance_mode": "offline",
        "title": {"es": "Poplife - NYE", "en": "Poplife - NYE"},
    }

    prod, prod_infos = api_prod_to_model_prod(test_input, LANG_MAP)

    assert len(prod_infos) == 1

    pi = prod_infos[0]

    assert pi.language_id == LANG_MAP["en"]


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

    event = api_event_to_model_event(test_input)

    assert event.id == 6169
    assert event.production_id == 4129
    assert event.starts_at == datetime.fromisoformat(test_input["starts_at"])
    assert event.ends_at == datetime.fromisoformat(test_input["ends_at"])
    assert event.order_url == test_input["external_order_url"]["nl"]


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

    eventprice = api_eventprice_to_model_eventprice(test_input)

    assert eventprice.id == 14103
    assert eventprice.event_id == 8385
    assert abs(eventprice.amount - 15.00) < 0.001  # Floats :)
    assert eventprice.available == test_input["available"]
    assert eventprice.expires_at == datetime.fromisoformat(test_input["expires_at"])
