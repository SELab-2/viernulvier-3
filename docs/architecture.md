# Architectuur Documentatie: VIERNULVIER Archief

Dit document beschrijft de high-level architectuur van het VIERNULVIER-archief, met aandacht voor de verschillende componenten en hun onderlinge interacties binnen de gecontaineriseerde omgeving.

## 1. Systeemoverzicht

De applicatie draait als een gecontaineriseerde webstack met een duidelijke
scheiding tussen publieke HTTP-verwerking, businesslogica, data-opslag en
achtergrondtaken.

- De basisstack bestaat uit vier langlevende services: `proxy`, `frontend`,
  `backend` en `database`.
- Een aparte `sync_worker` gebruikt dezelfde backend-image, maar draait enkel
  op aanvraag via het `sync`-profiel.
- In productie voegt `docker-compose.prod.yml` een extra `certbot`-service toe
  voor certificaatvernieuwing en wordt de productie-Nginx-configuratie geladen.

De keuze voor deze containeropzet is verder uitgewerkt in
[ADR-001](adr/001-docker.md) en
[ADR-002](adr/002-four-container-architecture.md).

## 2. Runtime-topologie

![Runtime Topologie](assets/architecture_diagram.png)

### 2.1 Netwerkgrenzen

- Alleen de `proxy`-container publiceert poorten naar buiten.
- `frontend` en `backend` gebruiken `expose` en zijn enkel intern bereikbaar.
- `database` heeft geen publieke poortbinding en is dus alleen vanuit het
  Docker-netwerk toegankelijk.
- `backend` en `sync_worker` wachten op een gezonde database via de
  PostgreSQL-healthcheck in `docker-compose.yml`.

## 3. Componenten

### 3.1 Proxy

De proxy gebruikt **Nginx** als enige publieke toegangspoort.

- In de basisstack luistert Nginx op poort `80` en routeert het verkeer op pad.
- Verkeer naar `/api/` wordt doorgestuurd naar `backend:8000`.
- Alle andere requests worden doorgestuurd naar `frontend:3000`.

In productie wordt de proxy uitgebreid met TLS-terminatie:

- HTTP op poort `80` dient voor redirects naar HTTPS en validatie.
- HTTPS op poort `443` gebruikt Let's Encrypt-certificaten uit een gedeeld
  volume.
- Nginx wordt periodiek gerefresht zodat vernieuwde certificaten worden
  opgepikt zonder de stack volledig te herstarten.

De productie-aanpak rond TLS-terminatie en certificaatbeheer is vastgelegd in
[ADR-013](adr/013-nginx-tls-certbot.md).

### 3.2 Frontend

De frontend draait als een aparte **Node.js 24** container.

- De image wordt gebouwd via een multi-stage Dockerfile.
- De container start via `npm run start` en luistert intern op poort `3000`.
- De frontend blijft achter de proxy en hoeft daarom geen eigen publieke
  netwerkconfiguratie te bevatten.

De keuze voor het React-framework en de component-bibliotheek is vastgelegd in
[ADR-005](adr/005-react-frontend.md) en
[ADR-006](adr/006-mui-frontend.md).

### 3.3 Backend API

De backend draait op **Python 3.14.3**, **FastAPI** en **Uvicorn**.

De keuze voor FastAPI als backendframework en Uvicorn als ASGI-server is
gemotiveerd in [ADR-004](adr/004-fastapi-backend.md) en
[ADR-007](ais een **RESTful API** en dr/007-uvicorn-asgi-server.md).

- De FastAPI-app gebruikt `root_path="/api"` en hangt alle API-routes onder
  `/api/v1`.
- De router is opgesplitst in drie hoofddomeinen:
  `status`, `auth` en `archive`.
- `status` bevat de healthcheck waarmee de API en databaseconnectie getest
  worden.
- `auth` bevat login, token refresh, profielopvraging en beheer van rollen en
  permissies.
- `archive` bevat de CRUD-operaties voor archiefentiteiten zoals producties,
  events, halls en tags.

De backend-container voert bij elke start eerst `python init_db.py` uit en pas
daarna `uvicorn src.main:app`.

Deze initialisatie-stap is cruciaal voor de "zero-config" ervaring:

- **Schema-sync:** Alle SQLAlchemy-tabellen worden aangemaakt indien ze nog niet bestaan.
- **Seeding:** Basisseeding wordt uitgevoerd voor permissies, talen, de `admin`-rol en een default admingebruiker (instelbaar via `.env`).
- **Idempotentie:** Het script kan veilig meerdere keren worden uitgevoerd zonder bestaande data te overschrijven.

De backend is opgezet als een stateless API: verzoeken gebruiken een
database-sessie per request en beveiligde endpoints vertrouwen op Bearer-tokens
in plaats van server-side sessiestatus.

### 3.4 Authenticatie en autorisatie

De huidige authenticatielaag is JWT-gebaseerd en rolgedreven.

- `POST /api/v1/auth/login` valideert gebruikersnaam en wachtwoord en levert
  zowel een access token als een refresh token op.
- `POST /api/v1/auth/refresh` levert op basis van een geldig refresh token een
  nieuw access token op.
- Access tokens bevatten het gebruikers-ID, de rolnaam of rolnamen en de
  afgeleide permissies van die rollen.
- Beschermde endpoints gebruiken de `HTTPBearer` dependency en halen daarna de
  actuele gebruiker uit de databank.
- Autorisatie gebeurt via `RequirePermissions(...)`, dat controleert of de
  huidige gebruiker de vereiste permissies heeft.

Dit levert in de praktijk een eenvoudige RBAC-opzet op met deze lagen:

1. `users`
2. `roles`
3. `permissions`
4. koppelrelaties `user_roles` en `role_permissions`

De keuze voor deze JWT- en RBAC-opzet is vastgelegd in
[ADR-012](adr/012-jwt-rbac-authentication.md).

### 3.5 Database

De databank draait in een aparte **PostgreSQL 15 alpine** container.

De keuze voor PostgreSQL als relationele databank is gemotiveerd in
[ADR-003](adr/003-postgresql-database.md).
- Persistentie gebeurt via het named volume `postgres_data`.
- SQLAlchemy beheert het datamodel en de sessies.
- De backend gebruikt een gedeelde declarative `Base` voor alle modellen.
- Requests gebruiken een korte SQLAlchemy-sessie via `Depends(get_db)`.

De databank bevat niet alleen archiefdata, maar ook authenticatiegegevens zoals
gebruikers, rollen en permissies.

De keuze voor SQLAlchemy en de PostgreSQL-driver is uitgewerkt in
[ADR-008](adr/008-sqlalchemy-orm.md) en
[ADR-009](adr/009-psycopg2-binary-adapter.md).

### 3.6 Sync worker

De sync worker is een aparte procesrol boven op dezelfde Docker-image als de
backend.

- De service gebruikt `python -m src.worker.sync_job` als entrypoint.
- Ze draait niet standaard mee met `docker compose up`, maar alleen via het
  `sync`-profiel of via een expliciete `docker compose run`.
- De worker gebruikt dezelfde configuratie en codebasis als de backend,
  inclusief toegang tot de databank en gedeelde modellen.
- De worker bevat een API-wrapperlaag rond de externe VIERNULVIER-API voor het synchroniseren van data zoals producties en events.

De scheiding tussen publieke API en achtergrondsync is apart vastgelegd in de
[ADR-010](adr/010-up-to-date-database.md).

### 3.7 Certbot in productie

De productie-override voegt een aparte `certbot`-container toe.

- `certbot-www` wordt gebruikt voor validatie challenges.
- `certbot-certs` bevat de uitgegeven certificaten.
- Certbot draait in een lus met `certbot renew` zodat certificaatvernieuwing
  geautomatiseerd is.

## 4. Belangrijkste datastromen

### 4.1 Browserverkeer

1. Een browser stuurt een request naar de host op poort `80` of `443`.
2. Nginx beslist op basis van het pad of het request naar frontend of backend
   moet.
3. De frontend levert HTML of app-responses voor gebruikerspagina's.
4. De backend verwerkt API-calls, raadpleegt PostgreSQL en geeft JSON terug.

Omdat frontend en backend achter dezelfde proxy hangen, verloopt de publieke
toegang als same-origin verkeer via Nginx in plaats van via directe
cross-origin browsercalls.

### 4.2 Authenticatieflow

1. Een admin meldt zich aan via `POST /api/v1/auth/login`.
2. De backend verifieert het wachtwoord tegen de gehashte waarde in de
   `users`-tabel.
3. Bij succes worden JWT-tokens uitgegeven.
4. Bij volgende requests wordt het access token meegestuurd als Bearer-token.
5. De backend decodeert het token, haalt de gebruiker opnieuw op uit de
   databank en controleert daarna de vereiste permissies.

Door de gebruiker opnieuw uit de databank te laden, blijft autorisatie
gekoppeld aan de actuele rollenstructuur en niet enkel aan oude tokenclaims.

### 4.3 Opstartflow van de backend

1. Docker start de databasecontainer.
2. Zodra de healthcheck slaagt, mag de backend opstarten.
3. `init_db.py` maakt tabellen aan en seedt basisdata.
4. Daarna start Uvicorn de FastAPI-app.

Dit zorgt ervoor dat een nieuwe omgeving zonder handmatige bootstrap een
minimale bruikbare auth-configuratie krijgt.

### 4.4 Synchronisatieflow

1. Een beheerder of host-cron start `sync_worker` expliciet.
2. De worker gebruikt de API key uit `.env` om de externe VIERNULVIER-API aan
   te spreken.
3. Fetcherklassen halen pagineerbare datasets op, zoals producties en events.
4. Verdere opslaglogica kan dezelfde gedeelde backendcode en databanklaag
   hergebruiken.

De worker is dus architecturaal gescheiden van het publieke HTTP-pad, zodat
achtergrondverwerking geen impact hoeft te hebben op de responstijd van de API.

## 5. Beveiliging

### 5.1 Transportbeveiliging

- Lokaal draait de stack standaard over HTTP op poort `80`.
- In productie wordt HTTP gereduceerd tot redirect- en ACME-verkeer.
- Alle normale gebruikersrequests horen in productie over HTTPS te lopen.

### 5.2 Applicatiebeveiliging

- Authenticatie gebruikt JWT access en refresh tokens.
- Wachtwoorden worden gehasht opgeslagen, nooit in plaintext.
- Autorisatie is fijnmazig en permissiegedreven in plaats van enkel
  rolgedreven op endpointniveau.
- De databank is niet rechtstreeks publiek bereikbaar.
- **Geheimenbeheer:** Geheimen zoals database-credentials, de JWT-secret en de externe API-key worden via één centraal `.env`-bestand beheerd dat door alle relevante containers wordt ingelezen.

## 6. Persistentie en deploymentvarianten

### 6.1 Persistente volumes

- `postgres_data`: PostgreSQL-data. Wordt beheerd door de `database`-container maar is de enige bron van waarheid voor zowel `backend` als `sync_worker`.
- `certbot-www`: webroot voor validatie challenges in productie. Gedeeld tussen `proxy` en `certbot`.
- `certbot-certs`: Let's Encrypt-certificaten in productie. Gedeeld tussen `proxy` en `certbot`.

### 6.2 Compose-varianten

- `docker-compose.yml`: lokale of generieke basisstack.
- `docker-compose.prod.yml`: productie-override voor TLS, Certbot en restartbeleid.
- `docker-compose.ci.yml`: aparte CI-configuratie voor tests.

## 7. Kwaliteitsborging

De betrouwbaarheid van de backend wordt gewaarborgd door een uitgebreide
testsuite op basis van **Pytest**.

- Er wordt onderscheid gemaakt tussen unit tests (logica) en integratietesten
  (endpoints en database).
- De teststrategie en de keuze voor Pytest zijn vastgelegd in
  [ADR-011](adr/011-pytest-backend-test.md).

## 8. ADRs

De detailmotivatie voor grotere ontwerpbeslissingen staat in `docs/adr/`.
In dit document worden vooral de ADRs aangehaald die rechtstreeks horen bij de
containeropzet, backendstack, authenticatie, sync worker en productieproxy.
