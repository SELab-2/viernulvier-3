import pytest

from src.api.exceptions import ValidationError
from src.services.production import (
    encode_cursor,
    decode_cursor,
    get_productions_paginated,
)
from datetime import datetime

BASE_URL = "http://test"


# Test if cursor encoding/decoding works when both date and id are non-null
def test_cursor_encode_decode_normal():
    dt = datetime(2026, 3, 1)
    cursor = encode_cursor(dt, 42)

    decoded_dt, decoded_id = decode_cursor(cursor)

    assert decoded_dt == dt
    assert decoded_id == 42


# Test if cursor encoding/decoding works when date is null
def test_cursor_encode_decode_null_date():
    cursor = encode_cursor(None, 42)

    decoded_dt, decoded_id = decode_cursor(cursor)

    assert decoded_dt is None
    assert decoded_id == 42


# Test if passing an invalid cursor causes a ValidationError
def test_cursor_decode_invalid():
    with pytest.raises(ValidationError):
        decode_cursor("invalid_cursor")


# Check if returned productions are in the correct order
@pytest.mark.parametrize("sort_order", ["Ascending", "Descending"])
def test_productions_are_sorted(db_session, many_productions, sort_order):
    result = get_productions_paginated(
        db_session, BASE_URL, sort_order=sort_order, limit=10
    )

    dates = [p.earliest_at for p in result.productions]

    assert dates == sorted(
        dates, key=lambda x: (x is None, x), reverse=(sort_order == "Descending")
    )


# Check if first page has earliest/latest productions globally
@pytest.mark.parametrize("sort_order", ["Ascending", "Descending"])
def test_first_page_contains_earliest_items(db_session, many_productions, sort_order):
    result = get_productions_paginated(
        db_session, BASE_URL, sort_order=sort_order, limit=3
    )

    all_result = get_productions_paginated(
        db_session, BASE_URL, sort_order=sort_order, limit=10
    )

    assert result.productions == all_result.productions[:3]


# Assert nulls are always sorted last regardless of sort order
@pytest.mark.parametrize("sort_order", ["Ascending", "Descending"])
def test_nulls_are_last(db_session, productions_with_null_dates, sort_order):
    result = get_productions_paginated(
        db_session, BASE_URL, sort_order=sort_order, limit=10
    )

    dates = [p.earliest_at for p in result.productions]

    seen_null = False
    for d in dates:
        if d is None:
            seen_null = True
        else:
            assert not seen_null


# Test if null-date productions being on the border between two pages still works
@pytest.mark.parametrize("sort_order", ["Ascending", "Descending"])
def test_nulls_start_on_second_page(
    db_session, productions_with_null_dates, sort_order
):
    page1 = get_productions_paginated(
        db_session, BASE_URL, sort_order=sort_order, limit=3
    )

    page2 = get_productions_paginated(
        db_session,
        BASE_URL,
        cursor=page1.pagination.next_cursor,
        sort_order=sort_order,
        limit=3,
    )

    assert all(p.earliest_at is not None for p in page1.productions)
    assert any(p.earliest_at is None for p in page2.productions)


# Test if encounering null-date productions in the middle of a page works
@pytest.mark.parametrize("sort_order", ["Ascending", "Descending"])
def test_cursor_with_null_date(db_session, productions_with_null_dates, sort_order):
    result = get_productions_paginated(
        db_session, BASE_URL, sort_order=sort_order, limit=5
    )

    next_cursor = result.pagination.next_cursor

    next_page = get_productions_paginated(
        db_session, BASE_URL, cursor=next_cursor, sort_order=sort_order, limit=5
    )

    assert all(p.earliest_at is None for p in next_page.productions)
