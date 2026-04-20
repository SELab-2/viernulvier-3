from src.services.artists import get_artists


def test_get_all_artists(db_session, productions_with_different_artists):
    result = get_artists(db_session)

    assert len(result.en) == 3
    assert len(result.nl) == 3

    assert "Steve" in result.en
    assert "Bob" in result.en
    assert "Donald" in result.en
    assert "Steven" in result.nl
    assert "Bob" in result.nl
    assert "Donald" in result.nl
