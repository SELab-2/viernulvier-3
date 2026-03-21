# viernulvier-3

Webapplicatie voor het archief van VIERNULVIER.

Voor een gedetailleerd overzicht van de architectuur en ontwerpbeslissingen, zie [`docs/architecture.md`](docs/architecture.md) en [`docs/adr/`](docs/adr/).

## Vereisten

- [Docker Desktop](https://www.docker.com/products/docker-desktop/) (of Docker Engine + Docker Compose)

## Opstarten

Maak een `.env` bestand aan in de root van het project op basis van het [`.env.example`](.env.example) bestand.

Start de volledige stack:

```bash
docker compose up -d
```

Bij een eerste opstart of na codewijzigingen, bouw de images opnieuw:

```bash
docker compose up --build -d
```

De applicatie is bereikbaar op [http://localhost](http://localhost).

## Compose-bestanden

- `docker-compose.yml` is de standaard voor lokaal ontwikkelen via HTTP.
- `docker-compose.deploy.yml` voegt restart policies toe voor langdurige serverdeployments.
- `docker-compose.ci.yml` is een aparte CI-stack, zodat tests geen lokale poortbindingen of volumes erven.
- `docker-compose.prod.yml` is een override die de productie-Nginx-configuratie, TLS en Certbot toevoegt bovenop de deployment-stack.

De proxy gebruikt `PROXY_PORT` uit het `.env` bestand om de publieke hostpoort te bepalen. Lokaal is dat standaard `80`, staging gebruikt `2002`.

## Deployment

- Push naar `dev` deployt automatisch naar de staging-omgeving op poort `2002` via GitHub Actions environment `staging`.
- Push naar `main` deployt automatisch naar productie via GitHub Actions environment `production`.
- Beide environments verwachten dezelfde secrets.

Voor een handmatige staging deployment op de server:

```bash
docker compose -f docker-compose.yml -f docker-compose.deploy.yml --project-name viernulvier-staging up -d --build
```

Voor productie gebruik je de basisstack samen met de productie-override:

```bash
docker compose -f docker-compose.yml -f docker-compose.deploy.yml -f docker-compose.prod.yml up -d --build
```

De productie-setup gaat ervan uit dat de Let's Encrypt-certificaten al een eerste keer zijn uitgegeven; de Compose-configuratie vernieuwt ze daarna automatisch.

## Sync Worker

De applicatie bevat een sync worker die dagelijks nieuwe data ophaalt uit de VIERNULVIER API en deze opslaat in de database. De worker gebruikt dezelfde Docker-image als de backend en start niet automatisch op met `docker compose up`.

Om de worker handmatig te draaien (bijvoorbeeld voor testing):

```bash
docker compose --profile sync run --rm sync_worker
```

Voor productie, stel een cron job in op de server om de worker dagelijks uit te voeren (bijvoorbeeld om 02:00):

```bash
0 2 * * * cd /path/to/your/project && docker compose -f docker-compose.yml -f docker-compose.deploy.yml -f docker-compose.prod.yml --profile sync --project-name viernulvier-prod run --rm sync_worker
```

Vervang `/path/to/your/project` door het absolute pad naar de projectdirectory op de server.

### Nuttige endpoints

| Endpoint                            | Beschrijving                               |
| ----------------------------------- | ------------------------------------------ |
| `http://localhost/`                 | Frontend                                   |
| `http://localhost/api/v1/health`    | Backend health check                       |
| `http://localhost/api/docs`         | Interactieve API-documentatie (Swagger UI) |

## Stoppen

Stop en verwijder de containers:

```bash
docker compose down
```

Om ook de database-volumes te verwijderen (let op: alle data gaat verloren):

```bash
docker compose down -v
```

## Logs bekijken

```bash
# Alle containers
docker compose logs -f

# Één specifieke container
docker compose logs -f backend
```
