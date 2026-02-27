# FastAPI Project Uitleg

## Overzicht

Dit project gebruikt FastAPI met een duidelijke scheiding tussen verantwoordelijkheden:

- API-laag → HTTP endpoints (routers)
- Service-laag → business- en databaselogica
- Models → SQLAlchemy database modellen
- Schemas → Pydantic validatie en response-definities
- Workers → background jobs / CLI scripts die dezelfde logica hergebruiken

Alle API-endpoints zijn gegroepeerd onder:

```/api/v1/...```

---

## Projectstructuur

```
backend/src/
├── main.py              ← Entrypoint, monteert alle routers
├── config.py            ← Omgevingsvariabelen (database URL, secret key, etc.)
├── database.py          ← Database-verbinding en sessie-afhandeling
├── api/
│   └── v1/              ← Alle endpoints onder /api/v1/
│       ├── status.py    ← GET  /api/v1/status
│       ├── auth/
│       │   ├── login.py ← POST /api/v1/auth/login
│       │   └── users.py ← GET  /api/v1/auth/me
│       └── archive/
│           ├── events.py      ← GET/POST/PUT/DELETE /api/v1/events
│           └── productions.py
├── models/
│   ├── event.py         ← SQLAlchemy model: event tabel
│   └── user.py          ← SQLAlchemy model: gebruiker
├── schemas/
│   ├── event.py         ← Pydantic schema's voor events
│   └── auth.py          ← Pydantic schema's voor auth
├── services/
│   ├── archive.py       ← Business- en databaselogica voor events
│   └── auth.py          ← Authenticatie & JWT logica
└── worker/
    └── sync_job.py      ← Background job / CLI script
```
---

## main.py

main.py is het entrypoint van de applicatie.
Hier wordt de FastAPI-app aangemaakt en worden alle routers gemonteerd.

```python

from fastapi import FastAPI

from api.v1.archive import global_archive_router
from api.v1.auth import global_auth_router

app = FastAPI(
    title="VierNulVier-Archief-API",
    version="0.1.0",
)

app.include_router(global_archive_router)
app.include_router(global_auth_router)

```

De routers uit **api.v1.archive** en **api.v1.auth** worden gegroepeerd in hun bijhorende ```__init__.py``` file in hun folder.

---

## API Routers

Elke file in api/v1 definieert een APIRouter.
Deze routers bevatten alleen HTTP-logica (request/response),
geen database- of businesslogica.

---

## Services

De services-laag bevat alle businesslogica en database-interacties.
Deze laag is herbruikbaar door:

- API routes
- Workers
- Tests


## Models

Models beschrijven hoe data in de database wordt opgeslagen.
Deze worden beheerd met SQLAlchemy.


## Schemas

Schemas bepalen:
- wat de API accepteert (request)
- wat de API terugstuurt (response)

Ze zorgen voor validatie en automatische OpenAPI-documentatie.


## Worker

Workers zijn scripts die buiten de HTTP-context draaien,
maar dezelfde services en models gebruiken.


## Requirements

requirements.txt bevat alle Python dependencies.

```
fastapi
uvicorn[standard]
sqlalchemy
pydantic
```

Installatie:


```pip install -r requirements.txt```

---

## Applicatie starten

Start de API lokaal met:

```uvicorn main:app --reload```

Automatische API-documentatie is beschikbaar op:

http://127.0.0.1:8000/docs