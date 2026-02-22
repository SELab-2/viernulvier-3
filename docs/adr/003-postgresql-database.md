# ADR-003: Keuze Databank: PostgreSQL

**Status:** Accepted **Datum:** 2026-02-14

## Context

We hebben een betrouwbare, schaalbare en onderhoudbare databank nodig voor het
archief van VIERNULVIER. De databank moet goed omgaan met gestructureerde data,
complexe queries ondersteunen en vlot integreren met de gekozen backend API
(FastAPI / Python). Daarnaast is dataconsistentie belangrijk om fouten en
dataverlies te vermijden.

## Beslissing

We gebruiken **PostgreSQL** als relationele databank voor het project.

## Argumenten

- **Betrouwbaarheid:** PostgreSQL is een stabiele databank met sterke garanties
  rond dataconsistentie.
- **Functionaliteit:** Ondersteunt standaard SQL-queries en geavanceerde
  datatypes, wat voldoende is voor huidige archiefdata, maar biedt ruimte voor
  complexere queries in de toekomst indien nodig.
- **Integratie:** Er bestaan verschillende Python-bibliotheken die het werken
  met PostgreSQL vergemakkelijken, wat handig is voor onze backend.
- **Schaalbaarheid:** Kan meegroeien van een beperkte dataset naar grote
  hoeveelheden data via indexing, partitioning en replicatie (handig als we
  moeten filteren).
- **Open source:** Geen licentiekosten en een grote, actieve community zorgen
  voor lange-termijnondersteuning.

## Gevolgen

- Datamodellering gebeurt relationeel en vraagt vooraf doordachte schema’s.
- Toekomstige wijzigingen in de databankkeuze moeten worden vastgelegd in een
  nieuwe ADR of door de status te wijzigen naar `Superseded`.
