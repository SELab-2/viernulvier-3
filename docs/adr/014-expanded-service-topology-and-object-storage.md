# ADR-014: Uitgebreide service-topologie met object storage

**Status:** Accepted
**Datum:** 2026-04-19

## Context

ADR-002 legde oorspronkelijk een vier-containeropzet vast met een aparte
frontend, backend, databank en reverse proxy, plus een kortstondige
sync-worker. Sindsdien is de applicatie geëvolueerd op drie punten:

- mediabestanden worden geüpload en publiek geserveerd, wat minder goed past in
  een puur relationele opslaglaag
- naast de sync worker bestaat nu ook een aparte CSV-importworker voor
  historische of ad-hoc data-import
- de operationele stack moet lokaal, in CI en in productie dezelfde logische
  componenten kunnen blijven draaien met minimale configuratieverschillen

We moesten dus beslissen of we de bestaande vier-containerarchitectuur zouden
aanhouden en media in de databank of backendcontainer zouden onderbrengen, of
de basisstack expliciet zouden uitbreiden met een object-storagecomponent en
meerdere optionele workerprofielen.

## Beslissing

We breiden de basisarchitectuur uit naar een **vijf-service runtime-stack**:

1. `proxy` voor publieke HTTP(S)-toegang
2. `frontend` voor React Router SSR
3. `backend` voor de FastAPI-API
4. `database` voor relationele opslag in PostgreSQL
5. `minio` voor S3-compatibele object storage van mediabestanden

Daarnaast behouden we achtergrondtaken als **aparte, on-demand procesrollen**
die de backend-image delen:

- `sync_worker` voor incrementele synchronisatie met de externe VIERNULVIER API
- `csv_worker` voor CSV-import in dezelfde databank

Concreet betekent dit ook dat:

- mediabytes in MinIO worden opgeslagen en enkel metadata in PostgreSQL
- de backend bij opstart de vereiste MinIO-bucket initialiseert
- de lokale proxy publieke lezingen van `/media/` rechtstreeks naar MinIO kan
  routeren
- workers niet standaard mee opstarten met de langlevende webstack, maar via
  Compose-profielen geactiveerd worden

## Argumenten

- **Geschikte opslag per datatype:** relationele metadata en binaire objecten
  hebben andere operationele noden; object storage past beter bij uploads,
  publieke reads en groeibare mediacollecties.
- **Behouden scheiding van verantwoordelijkheden:** de backend blijft eigenaar
  van validatie en metadata, terwijl MinIO de objectopslag afhandelt.
- **Operationele eenvoud:** een expliciete MinIO-service is duidelijker en
  beheersbaarder dan bestanden in een backendcontainer of op een impliciet
  hostpad bewaren.
- **Herbruikbare workerarchitectuur:** sync- en importtaken kunnen dezelfde
  modellen en databanklaag gebruiken zonder de publieke API te belasten.
- **Veilige standaardruntime:** achtergrondtaken draaien niet permanent mee en
  moeten expliciet via profielen of cron gestart worden.
- **Omgevingspariteit:** dezelfde logische componenten blijven zichtbaar in
  lokale development, CI en productie, met beperkte environment-specifieke
  verschillen.

## Gevolgen

- `docker-compose.yml` bevat naast PostgreSQL nu ook een persistente
  `minio`-service en een `minio_data` volume.
- De backend hangt bij opstart af van zowel `database` als `minio`.
- Media-URLs verwijzen logisch naar dezelfde host, terwijl de objecten fysiek
  in MinIO opgeslagen worden.
- Deployment en documentatie moeten onderscheid maken tussen langlevende
  services en optionele workerprofielen.
- ADR-002 blijft gelden als historisch tussenstadium, maar beschrijft niet meer
  de actuele productie- en ontwikkelarchitectuur.
