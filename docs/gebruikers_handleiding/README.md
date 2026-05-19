# Handleiding Serveropzet

> Deze handleiding is ook beschikbaar als PDF:
> [gebruikershandleiding.pdf](gebruikershandleiding.pdf)

## Vereisten

- Docker en Docker Compose geïnstalleerd
- Poorten 80 en 443 open in de firewall
- Domein wijst naar de server (bv. `sel2-3.ugent.be`)

---

## 1. Repository klonen

**Optie A — via git:**

```bash
git clone <REPO-URL>
cd viernulvier-3
```

**Optie B — via zip (als git niet beschikbaar is):**

```bash
unzip viernulvier-3.zip
cd viernulvier-3
```

---

## 2. Het `.env` bestand aanmaken

```bash
cp .env.example .env
```

Vul de waarden in `.env` aan. Velden gemarkeerd met `# ⚠ aanpassen` moeten een
eigen geheime waarde krijgen. De rest kan zo gelaten worden:

```bash
# Database
POSTGRES_USER=viernulvier          # kan zo blijven
POSTGRES_PASSWORD=                 # ⚠ aanpassen
POSTGRES_DB=viernulvier_archief    # kan zo blijven
DATABASE_HOST=database             # kan zo blijven
DATABASE_PORT=5432                 # kan zo blijven

# Authenticatie
JWT_SECRET_KEY=                    # ⚠ aanpassen — gebruik een lange willekeurige string
JWT_ALGORITHM=HS256                # kan zo blijven
ACCESS_TOKEN_EXPIRE_MINUTES=30     # kan zo blijven
REFRESH_TOKEN_EXPIRE_MINUTES=43200 # kan zo blijven

# Sync worker
VIERNULVIER_KEY=                   # ⚠ aanpassen — API-sleutel voor de VNV-sync

# Frontend
VITE_API_BASE_URL=https://<uw-domein>/  # ⚠ aanpassen — moet overeenkomen met uw domein

# MinIO (objectopslag)
MINIO_ROOT_USER=                   # ⚠ aanpassen
MINIO_ROOT_PASSWORD=               # ⚠ aanpassen
MINIO_ENDPOINT=minio:9000          # kan zo blijven
MINIO_BUCKET=media                 # kan zo blijven
MINIO_VISUALS_BUCKET=visuals       # kan zo blijven

# Beheerder
DEFAULT_ADMIN_PASSWORD=            # ⚠ aanpassen
```

---

## 3. TLS — Certbot (enkel de eerste keer)

De certificaten moeten bestaan voordat de volledige prod-stack opgestart wordt.
Bootstrap ze via een tijdelijke nginx die enkel de ACME-challenge afhandelt.

**Stap 1** — Start een tijdelijke nginx op poort 80:

```bash
docker compose \
  -f docker-compose.yml \
  -f docker-compose.prod.yml \
  --project-name viernulvier-prod \
  up -d proxy certbot
```

**Stap 2** — Haal het initiële certificaat op via certbot:

```bash
docker compose \
  -f docker-compose.yml \
  -f docker-compose.prod.yml \
  --project-name viernulvier-prod \
  run --rm certbot \
  certbot certonly --webroot \
  --webroot-path=/var/www/certbot \
  --email <UW-EMAIL> \
  --agree-tos \
  --no-eff-email \
  -d sel2-3.ugent.be
```

**Stap 3** — Zet alles af en ga verder met de volledige opstart hieronder:

```bash
docker compose \
  -f docker-compose.yml \
  -f docker-compose.prod.yml \
  --project-name viernulvier-prod \
  down
```

> Certificaatvernieuwing wordt automatisch afgehandeld door de
> certbot-container, die elke 12 uur `certbot renew` uitvoert. Nginx herlaadt
> ook elke 12 uur om vernieuwde certificaten op te pikken.

---

## 4. Volledige stack opstarten

```bash
docker compose \
  -f docker-compose.yml \
  -f docker-compose.prod.yml \
  --project-name viernulvier-prod \
  up --build --force-recreate -d --remove-orphans
```

Controleer of alles draait:

```bash
docker ps
```

---

## 5. Sync-worker uitvoeren (manueel / eerste keer)

Voer uit in de achtergrond zodat de terminal gesloten kan worden:

```bash
docker compose \
  -f docker-compose.yml \
  -f docker-compose.prod.yml \
  --project-name viernulvier-prod \
  --profile sync \
  run --rm -d sync_worker
```

Controleer of de worker klaar is:

```bash
docker ps -a | grep sync_worker
```

`Exited (0)` = geslaagd. Een andere exitcode = mislukt, controleer de logs:

```bash
docker logs <CONTAINER-ID>
```

---

## 6. Cronjob voor de sync-worker

Stel een cronjob in om de sync-worker automatisch uit te voeren.

Open de crontab:

```bash
crontab -e
```

Voeg een regel toe, bijvoorbeeld elke nacht om 2u:

```
0 2 * * * cd /home/<gebruiker>/actions-runner/_work/viernulvier-3/viernulvier-3 && docker compose -f docker-compose.yml -f docker-compose.prod.yml --project-name viernulvier-prod --profile sync run --rm sync_worker >> /var/log/viernulvier-sync.log 2>&1
```

> Vervang het pad door het werkelijke pad naar de projectroot.
> De `>> /var/log/viernulvier-sync.log 2>&1` schrijft de uitvoer weg naar een
> logbestand — zorg dat de gebruiker die de cron uitvoert schrijfrechten heeft
> op dat pad, of gebruik een pad naar keuze (bv. `~/sync.log`).

Controleer of de cronjob geregistreerd is:

```bash
crontab -l
```

---

## 7. Syncstatus controleren

Bekijk de laatste synctijdstempels in de database:

```bash
docker exec \
  viernulvier-prod-database-1 \
  psql -U <POSTGRES_USER> -d <POSTGRES_DB> \
  -c "SELECT * FROM sync_state;"
```

---

## 8. CSV-worker uitvoeren (eenmalig)

Opgelet: het is belangrijk dat deze CSV worker pas wordt uitgevoerd nadat de
sync-worker succesvol heeft kunnen uitvoeren om te zorgen dat alles mooi linkt
in de databank.

```bash
docker compose \
  -f docker-compose.yml \
  -f docker-compose.prod.yml \
  --project-name viernulvier-prod \
  --profile csv \
  run --rm csv_worker
```
