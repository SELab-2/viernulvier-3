# ADR-007: Keuze ASGI Server: Uvicorn

**Status:** Accepted
**Datum:** 2026-02-22

## Context

FastAPI is een ASGI-gebaseerd framework (Asynchronous Server Gateway Interface). In tegenstelling tot traditionele WSGI-frameworks (zoals Flask), heeft FastAPI een ASGI-server nodig om HTTP-verzoeken af te handelen en de applicatie te draaien. De server moet snel zijn, asynchrone verwerking ondersteunen en stabiel zijn voor productie.

## Beslissing

We gebruiken **Uvicorn** als de ASGI server om de FastAPI applicatie te draaien.

## Argumenten

- **Snelheid:** Uvicorn is een van de snelste ASGI-servers voor Python, gebouwd op `uvloop` en `httptools`.
- **Eenvoud:** Het is lichtgewicht en eenvoudig te configureren via de command line of binnen Docker-containers.
- **Compatibiliteit:** Het is de door FastAPI aanbevolen server en ondersteunt HTTP/1.1 en WebSockets volledig.
- **Directe Controle:** In tegenstelling tot de FastAPI CLI (die meer gericht is op development), biedt het direct gebruiken van Uvicorn meer fijnmazige controle over server-instellingen die cruciaal zijn voor een stabiele productie-omgeving.

## Gevolgen

- De `Dockerfile` voor de backend zal Uvicorn gebruiken als entrypoint.
