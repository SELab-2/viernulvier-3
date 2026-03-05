# Pytest testen
In dit document ga ik de manier van testen voor de backend uitleggen.

### Structuur
In dit voorbeeld zal ik werken met een hypothetische endpoint `/foo` dat een
`GET` ondersteund. Ik zal volgende projectstructuur hanteren:
```
backend
├── src/
│   ├── database.py
│   ├── foo.py
│   ├── main.py
│   ├── models/
│   │   └── foo.py
│   └── services/
│       └── foo.py
└── tests/
    ├── conftest.py
    ├── unit_tests/
    │   └── test_foo_service.py
    └── integration_tests/
        └── test_foo.py

```

## Endpoints
Voor deze manier van testen moeten de endpoints op een bepaalde manier
geïmplementeerd worden:
```py
from fastapi import Depends

from src.main import app
from src.database import get_db
from src.services.foo import get_foo_data


@app.get("/foo")
async def foo(db=Depends(get_db)):
    data = await get_foo_data(db)
    return {"data": data}
```
Met `src/services/foo.py`:
```py
from sqlalchemy import select
from src.models.foo import Foo

async def get_foo_data(session):
    result = await session.execute(select(Foo.name))
    # Doe eventuele bewerkingen op result
    return result.scalars().all()
```
Deze manier van werken zorgt ervoor dat we `get_foo_data` als unit test kunnen
uitvoeren en `get("/foo")` als integration test.

## Unit test
Voor unit test kunnen we kleine mock results maken die mogelijke edge cases
voor de `get_foo_data` zijn. Dit kan op deze manier in
`test/unit_tests/test_foo_service.py`:
```py
import pytest
from unittest.mock import AsyncMock, MagicMock
from src.services.foo import get_foo_data

@pytest.mark.asyncio
async def test_get_foo_data():
    fake_session = AsyncMock()

    # Wat moet de databank returnen
    fake_result = MagicMock()
    fake_result.scalars.return_value.all.return_value = [
       "", # Test lege string
       "abc", # Test normale string
       "ë" # Test niet ASCII karakter
    ]

    fake_session.execute.return_value = fake_result

    result = await get_foo_data(fake_session)

    # Test dat lege string wordt gefilterd
    assert len(result) == 2
    # Test dat het maar 1 keer fetch_all oproept
    fake_db.fetch_all.assert_called_once()
    # ...
```

## Integration test
Voor de integration test zullen we gebruik maken van de fake databank in
`test/conftest.py`. Dit kan op deze manier in
`test/integration_tests/test_foo.py`
```
def test_foo(client):
    response = client.get("/foo")

    assert response.status_code == 200
    data = response.json()["data"]

    # Test dat er een resultaat is
    assert len(data) > 0
    # Test op een bepaalde waarde
    assert "foo_name" in data
    # ...
```

## Hoe testen?
De testen voor de backend kan je uitvoeren door volgende stappen te volgen:
1. Zorg dat je een geldige `.env` in root hebt staan
2. Zorg dat je CWD `backend/` is (`cd backend/`)
3. Zorg dat je alle packages geïnstalleerd hebt: `pip install -r requirements.txt`, `pip install -r requirements-dev.txt`
4. Voer pytest uit `pytest test/`

Coverage kan op een gelijkaardige manier berekent worden, stappen 1-3 zijn hetzelfde.
4. Voer coverage op pytest uit: `coverage run -m pytest test/`
5. Laad het coverage bestand: `coverage report -m`
