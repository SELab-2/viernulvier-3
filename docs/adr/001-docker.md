# ADR-001: Keuze Containerisatie: Docker

**Status:** Accepted **Datum:** 2026-02-14

## Context

Het VIERNULVIER-archief bestaat uit meerdere componenten (frontend, backend,
database, reverse proxy) die samenwerken. We hebben een manier nodig om deze
componenten betrouwbaar en reproduceerbaar te bouwen, te testen en te deployen,
ongeacht het ontwikkel- of productieplatform. Daarnaast willen we dat elk
teamlid snel een werkende lokale omgeving kan opzetten.

## Beslissing

We gebruiken **Docker** en **Docker Compose** als containerisatieplatform voor
het gehele project.

## Argumenten

- **Reproduceerbaarheid:** Elke component draait in een geïsoleerde container
  met een vastgelegd OS, runtime en dependencies. Dit voorkomt "works on my
  machine"-problemen.
- **Eenvoudige opzet:** Met één `docker compose up` commando draait de volledige
  stack lokaal, wat de onboarding voor nieuwe teamleden sterk vereenvoudigt.
- **Isolatie:** Containers draaien onafhankelijk van elkaar, waardoor een
  probleem in één component de rest niet beïnvloedt.
- **Productie-pariteit:** Dezelfde Docker-images die lokaal worden gebouwd,
  kunnen zonder aanpassing naar productie worden uitgerold.
- **Ecosysteem:** Docker is de industriestandaard voor containerisatie, met
  uitgebreide documentatie, tooling en community-ondersteuning.

## Gevolgen

- Elk teamlid moet Docker (Desktop) geïnstalleerd hebben om lokaal te
  ontwikkelen.
- Alle componenten worden gedefinieerd via `Dockerfile`s en georkestreerd met
  `docker-compose.yml`.
- Wijzigingen aan de infrastructuur (nieuwe containers, netwerkconfiguratie,
  volumes) worden bijgehouden in versiebeheer.
- Toekomstige wijzigingen aan de containerisatiestrategie moeten worden
  vastgelegd in een nieuwe ADR of door de status te wijzigen naar `Superseded`.
