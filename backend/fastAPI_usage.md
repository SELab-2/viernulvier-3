# FastAPI Project Uitleg

## Projectstructuur

```
project/
├── main.py             # Hoofdbestand van de API
├── routers/
│   ├── __init__.py     # Maakt de folder een Python package (kan leeg zijn)
│   └── events.py       # Router voor event endpoints
├── requirements.txt    # Vereiste Python packages
```

---

## main.py

Dit is het **entrypoint** van de API. Hier maak je de FastAPI-app aan en voeg je routers toe. Bijvoorbeeld:



```python

from fastapi import FastAPI

from routers.events import router as events_router
from routers.productions import router as production_router

app = FastAPI(
    title="VierNulVier-Archief-API",
    version="0.1.0",
)

app.include_router(events_router)
app.include_router(production_router)

```

**Uitleg:**
- `FastAPI()` maakt de applicatie.
  
- `app.include_router()` voegt een set endpoints toe die je in een aparte file beheert.

- Zo blijft `main.py` **schoon en overzichtelijk**.


Als we een nieuwe endpoint willen zullen we dus het volgende moeten toevoegen:
 
```python
from routers import events, productions, ... new_router_file
...
app.include_router(new_router_file.router)
```
---

**Wat is ```__init__.py```?**

- Dit bestand is nodig in een folder om aan te geven aan python dat dit een module is die we willen kunnen importeren van elders. Dit bestand mag leeg zijn (wat bij ons dus het geval is) maar moet er wel zijn.

## routers/events.py

Hier definieer je de **routes** (API-endpoints):

```python
from fastapi import APIRouter

router = APIRouter()

@router.get("/event/{event_id}")
def get_event(event_id: int) -> dict:
    return {"event_id": "{event_id}", "description": "some description"}
```

**Uitleg:**
- `APIRouter()` maakt een router voor gerelateerde endpoints.
- `@router.get("/event/{event_id}")` definieert een **GET endpoint**.
- `{event_id}` is een **path parameter**. De waarde die je meegeeft in de URL komt automatisch in de functie terecht.
- De functie retourneert een dictionary (`dict`) die FastAPI automatisch omzet naar JSON.

**Voorbeeld aanroep:**
```
GET http://127.0.0.1:8000/event/42
```


---

## Extra uitleg mogelijke parameters

- **Query parameters** kan je toevoegen door extra argumenten in de functie te zetten:

```python
@router.get("/event/{event_id}")
def get_event(event_id: int, detailed: bool = False):
    return {"event_id": event_id, "detailed": detailed}
```

Aanroep in de browser / Postman:

```
GET http://127.0.0.1:8000/event/42?detailed=true
```

---

## Requirements

Er is een ```requirements.txt``` file die de extra modules bevat die we gebruiken (o.a. dus FastAPI). Die ziet er bv zo uit:

```
fastapi
uvicorn[standard]
```

Moesten we er nog nodig hebben, voeg dan op een nieuwe regel de naam van deze module toe.

**Installatie:**

We kunnen deze file dan gebruiken om alles in 1 keer op te halen.

```
pip install -r requirements.txt
```

---

## App draaien



```
uvicorn main:app --reload
```

- `--reload` zorgt dat de server automatisch herstart bij aanpassingen.
- Bezoek `/docs` voor automatische API-documentatie:

```
http://127.0.0.1:8000/docs
```
