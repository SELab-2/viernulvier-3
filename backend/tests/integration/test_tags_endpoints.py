import pytest
from sqlalchemy.orm import Session

from src.models.language import Language

TAGS_URL = "/api/v1/archive/tags"

@pytest.fixture
def language(db_session: Session):
    lang = Language(
        id=1,
        language="English"
    )

    db_session.add(lang)
    db_session.commit()
    db_session.refresh(lang)

    return lang

def test_create_tag(client, language):
    response = client.post(
        TAGS_URL,
        json={
            "names": [
                {"language_id": language.id, "name": "tag_1"},
            ]
        }
    )
    assert response.status_code == 200

    data = response.json()
    assert "id" in data
    assert len(data["names"]) == 1
    assert data["names"][0]["name"] == "tag_1"


def test_get_tag(client, language):
    created_tag = client.post(
        TAGS_URL,
        json={"names": [{"language_id": language.id, "name": "tag1"}]}
    )

    tag_url = created_tag.json()["id"]
    tag_id = tag_url.split("/")[-1]

    response = client.get(f"{TAGS_URL}/{tag_id}")
    assert response.status_code == 200

    data = response.json()
    assert data["names"][0]["name"] == "tag1"



def test_get_tags(client, language):
    n = 5
    for i in range(n):
        client.post(
            TAGS_URL,
            json={"names": [{"language_id": language.id, "name": f"tag{i}"}]}
        )

    response = client.get(TAGS_URL)
    assert response.status_code == 200
    data = response.json()

    assert len(data) == n

    for i in range(n):
        # check if all tags are present in list of tags (independent of order)
        assert any(data[j]["names"][0]["name"] == f"tag{i}" for j in range(n))


def test_delete_tag(client, language):
    created_tag = client.post(
        TAGS_URL,
        json={"names": [{"language_id": language.id, "name": "tag1"}]}
    )

    tag_id = created_tag.json()["id"].split("/")[-1]

    response = client.delete(f"{TAGS_URL}/{tag_id}")
    assert response.status_code == 200

    get_response = client.get(f"{TAGS_URL}/{tag_id}")
    assert get_response.status_code == 404
