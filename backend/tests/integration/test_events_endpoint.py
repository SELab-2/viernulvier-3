from fastapi.testclient import TestClient
from sqlalchemy.orm import Session
from src.models.event import Event, EventPrice
from src.models.hall import Hall
from src.models.production import Production
from src.models.role import Role
from src.models.user import User
from src.services.auth.password import get_password_hash
from src.services.auth.permissions import Permissions

BASE_URL = "/api/v1/archive/events"


def create_user_and_login(
    client: TestClient, db_session: Session, username: str, permissions=None
):
    password = "test_pw"
    hashed = get_password_hash(password)

    role = Role(name=f"{username}_role")
    if permissions:
        from src.models.permission import Permission

        perm_objs = []
        for p in permissions:
            perm = db_session.query(Permission).filter_by(name=p).first()
            if not perm:
                perm = Permission(name=p)
                db_session.add(perm)
            perm_objs.append(perm)
        role.permissions = perm_objs

    user = User(username=username, hashed_password=hashed, roles=[role])
    db_session.add(role)
    db_session.add(user)
    db_session.commit()

    login_response = client.post(
        "/api/v1/auth/login/", json={"username": username, "password": password}
    )

    token = login_response.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}


def test_create_event_success(client: TestClient, db_session: Session):
    hall = Hall(name="Hall A", address="Street A")
    production = Production()
    db_session.add_all([hall, production])
    db_session.commit()

    headers = create_user_and_login(
        client, db_session, "create_event_user", [Permissions.ARCHIVE_CREATE]
    )

    response = client.post(
        BASE_URL + "/",
        json={
            "production_id": str(production.id),
            "hall_id": str(hall.id),
            "order_url": "http://order.url",
        },
        headers=headers,
    )

    assert response.status_code == 201
    data = response.json()
    assert data["production_id"].endswith(str(production.id))
    assert data["hall_id"].endswith(str(hall.id))
    assert data["order_url"] == "http://order.url"


def test_get_event_by_id(client: TestClient, db_session: Session):
    hall = Hall(name="Hall B", address="Street B")
    production = Production()
    event = Event(
        hall=hall,
        production=production,
        order_url="http://order.url",
    )
    db_session.add_all([hall, production, event])
    db_session.commit()

    response = client.get(f"{BASE_URL}/{event.id}")
    assert response.status_code == 200
    data = response.json()
    assert data["id"].endswith(str(event.id))
    assert data["hall_id"].endswith(str(hall.id))
    assert data["production_id"].endswith(str(production.id))


def test_get_event_not_found(client: TestClient):
    response = client.get(f"{BASE_URL}/9999")
    assert response.status_code == 404


def test_update_event_success(client: TestClient, db_session: Session):
    hall = Hall(name="Hall C", address="Street C")
    production = Production()
    event = Event(
        hall=hall,
        production=production,
        order_url="http://old.url",
    )
    db_session.add_all([hall, production, event])
    db_session.commit()

    headers = create_user_and_login(
        client, db_session, "update_event_user", [Permissions.ARCHIVE_UPDATE]
    )

    response = client.patch(
        f"{BASE_URL}/{event.id}", json={"order_url": "http://new.url"}, headers=headers
    )
    assert response.status_code == 200
    data = response.json()
    assert data["order_url"] == "http://new.url"


def test_update_event_not_found(client: TestClient, db_session: Session):
    headers = create_user_and_login(
        client, db_session, "update_fail_user", [Permissions.ARCHIVE_UPDATE]
    )

    response = client.patch(
        f"{BASE_URL}/9999", json={"order_url": "http://new.url"}, headers=headers
    )
    assert response.status_code == 404


def test_delete_event_success(client: TestClient, db_session: Session):
    hall = Hall(name="Hall D", address="Street D")
    production = Production()
    event = Event(
        hall=hall,
        production=production,
        order_url="http://order.url",
    )
    db_session.add_all([hall, production, event])
    db_session.commit()

    headers = create_user_and_login(
        client, db_session, "delete_event_user", [Permissions.ARCHIVE_DELETE]
    )

    response = client.delete(f"{BASE_URL}/{event.id}", headers=headers)
    assert response.status_code == 204


def test_delete_event_not_found(client: TestClient, db_session: Session):
    headers = create_user_and_login(
        client, db_session, "delete_fail_user", [Permissions.ARCHIVE_DELETE]
    )

    response = client.delete(f"{BASE_URL}/9999", headers=headers)
    assert response.status_code == 404


def test_create_event_without_permission(client: TestClient, db_session: Session):
    hall = Hall(name="Hall E", address="Street E")
    production = Production()
    db_session.add_all([hall, production])
    db_session.commit()

    headers = create_user_and_login(client, db_session, "no_perm_user")

    response = client.post(
        BASE_URL + "/",
        json={
            "production_id": str(production.id),
            "hall_id": str(hall.id),
            "order_url": "http://order.url",
        },
        headers=headers,
    )
    assert response.status_code == 403


def test_get_event_prices_success(client: TestClient, db_session: Session):
    hall = Hall(name="Hall Prices", address="Street Prices")
    production = Production()

    event = Event(
        hall=hall,
        production=production,
        order_url="http://order.url",
    )

    price1 = EventPrice(
        event=event,
        amount=10.0,
        available=100,
    )

    price2 = EventPrice(
        event=event,
        amount=25.0,
        available=50,
    )

    db_session.add_all([hall, production, event, price1, price2])
    db_session.commit()

    response = client.get(f"{BASE_URL}/{event.id}/prices")

    assert response.status_code == 200
    data = response.json()

    assert len(data) == 2
    assert any(p["available"] == 100 for p in data)
    assert any(p["available"] == 50 for p in data)


def test_get_event_prices_event_not_found(client: TestClient):
    response = client.get(f"{BASE_URL}/9999/prices")

    assert response.status_code == 404


def test_get_event_price_success(client: TestClient, db_session: Session):
    hall = Hall(name="Hall Price Detail", address="Street Price Detail")
    production = Production()

    event = Event(
        hall=hall,
        production=production,
        order_url="http://order.url",
    )

    price = EventPrice(
        event=event,
        amount=15.0,
        available=75,
    )

    db_session.add_all([hall, production, event, price])
    db_session.commit()

    response = client.get(f"{BASE_URL}/{event.id}/prices/{price.id}")

    assert response.status_code == 200
    data = response.json()

    assert data["id"].endswith(str(price.id))
    assert float(data["amount"]) == 15.0


def test_get_event_price_not_found(client: TestClient, db_session: Session):
    hall = Hall(name="Hall Missing Price", address="Street Missing Price")
    production = Production()

    event = Event(
        hall=hall,
        production=production,
        order_url="http://order.url",
    )

    db_session.add_all([hall, production, event])
    db_session.commit()

    response = client.get(f"{BASE_URL}/{event.id}/prices/9999")

    assert response.status_code == 404


def test_event_url_contains_full_path(client: TestClient, db_session: Session):

    from src.models.hall import Hall
    from src.models.production import Production
    from src.models.event import Event

    hall = Hall(name="Hall URL Test", address="Street URL Test")
    production = Production()
    db_session.add_all([hall, production])
    db_session.commit()

    event = Event(hall=hall, production=production, order_url="https://order_example")
    db_session.add(event)
    db_session.commit()

    response = client.get(f"{BASE_URL}/{event.id}")
    assert response.status_code == 200
    data = response.json()

    event_url = data.get("id")
    assert event_url is not None

    assert "/api/v1/archive/events" in event_url

    assert str(event.id) in event_url


def test_event_price_url_contains_full_path(client: TestClient, db_session: Session):

    # setup
    hall = Hall(name="Hall Price Test", address="Street Price Test")
    production = Production()
    event = Event(hall=hall, production=production, order_url="https://order_example")
    db_session.add_all([hall, production, event])
    db_session.commit()

    price = EventPrice(event=event, amount=20.0, available=50)
    db_session.add(price)
    db_session.commit()

    # actual request
    response = client.get(f"{BASE_URL}/{event.id}/prices/{price.id}")
    assert response.status_code == 200
    data = response.json()

    price_url = data.get("id")
    assert price_url is not None

    assert f"/api/v1/archive/events/{event.id}/prices/{price.id}" in price_url

    assert str(price.id) in price_url
