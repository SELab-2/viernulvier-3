# ADR-002: Keuze Architectuur: Vier-Container-Opzet

**Status:** Accepted
**Datum:** 2026-02-14

## Context

De applicatie bestaat uit een frontend, backend, database en een reverse proxy. We moeten beslissen hoe we deze componenten verdelen over Docker-containers. Één optie is om de reverse proxy en frontend samen te voegen in één Nginx-container die zowel statische bestanden serveert als verkeer doorstuurt. Een andere optie is om elke component in een eigen container te plaatsen.

## Beslissing

We verdelen de applicatie over **vier afzonderlijke containers**: reverse proxy (Nginx), frontend (Node.js), backend (Python/FastAPI) en database (PostgreSQL). Daarnaast is er een vijfde, kortstondige **sync-worker** container die dezelfde image deelt met de backend.

## Argumenten

- **Scheiding van verantwoordelijkheden:** Elke container heeft één duidelijke taak. De proxy routeert verkeer, de frontend serveert de React-applicatie, de backend verwerkt API-logica en de database beheert data-opslag.
- **Onafhankelijke schaalbaarheid:** Containers kunnen afzonderlijk worden geschaald of herstart zonder impact op andere componenten.
- **Flexibiliteit:** De frontend kan onafhankelijk worden ge-upgrade of vervangen (bijv. van statische bestanden naar server-side rendering) zonder de proxyconfiguratie te wijzigen.
- **Debugbaarheid:** Problemen kunnen sneller worden geïsoleerd wanneer elke component zijn eigen container en logs heeft.
- **Herbruikbaarheid:** De Nginx-proxy kan ongewijzigd blijven bij aanpassingen aan de frontend-stack, en vice versa.

## Gevolgen

- Het interne Docker-netwerk routeert verkeer tussen de containers; enkel de proxy-container is van buitenaf bereikbaar.
- De `docker-compose.yml` orkestreert alle containers met expliciete `depends_on`-relaties.
- Elke container heeft een eigen `Dockerfile` en wordt afzonderlijk gebouwd.
- Toekomstige wijzigingen aan de containerindeling moeten worden vastgelegd in een nieuwe ADR of door de status te wijzigen naar `Superseded`.
