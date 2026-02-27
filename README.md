# viernulvier-3

Een webapplicatie voor het archief van VIERNULVIER, opgebouwd uit vier Docker-containers: een Nginx reverse proxy, een React frontend, een FastAPI backend en een PostgreSQL database.

Voor een gedetailleerd overzicht van de architectuur en ontwerpbeslissingen, zie [`docs/architecture.md`](docs/architecture.md) en [`docs/adr/`](docs/adr/).

## Vereisten

- [Docker Desktop](https://www.docker.com/products/docker-desktop/) (of Docker Engine + Docker Compose)

## Opstarten

Maak een `.env` bestand aan in de root van het project op basis van het onderstaande voorbeeld:

```env
POSTGRES_USER=viernulvier
POSTGRES_PASSWORD=geheimwachtwoord
POSTGRES_DB=viernulvier_archief
```

Start de volledige stack:

```bash
docker compose up -d
```

Bij een eerste opstart of na codewijzigingen, bouw de images opnieuw:

```bash
docker compose up --build -d
```

De applicatie is bereikbaar op [http://localhost](http://localhost).

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
