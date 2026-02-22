# ADR-007: Up to date archief

**Status:** Proposed
**Datum:** 2026-02-22

## Context

Om de archief databank automatisch up to date te houden is het nodig dat we
regelmatig de data uit de hoofdwebsite halen en in onze databank opslaan.
Dit doen we aan de hand van een Python script dat elke nacht de producties van
die dag ophaalt en archiveert.

Voor dit script moesten we beslissen om het opslaan van de data te doen via het
aanspreken van de backend API of via een rechtstreekse verbinding met de
databank.

## Beslissing

We besloten een rechtstreekse verbinding met de databank te gebruiken. Hiervoor
gebruiken we via docker delen van de code van de backend.

## Argumenten

- **Onafhankelijkheid:** Door rechstreeks met de databank te praten kan het
    archiveren doorgaan, ook al is de backend niet beschikbaar.
- **Eenvoudigere betrouwbaarheid:** Databanken bieden transacties en commits aan
    die voor de garantie zorgen dat het toevoegen van data zonder fouten gebeurt.
    Mochten we data toevoegen door de API dan moeten we die garantie zelf ook
    programmeren in het protocol.
- **Geen speciale API nodig:** De backend API heeft geen extra endpoints nodig
    die speciaal op het scraper-script zijn afgestemd en kan zich dus focussen
    op het communiceren met de frontend.

## Gevolgen

- Het script is iets ingewikkelder omdat het rekening moet houden met de databank.
- De docker configuratie is iets ingewikkelders omdat het script code deelt met
    de backend.
- Toekomstige wijzigingen aan de containerisatiestrategie moeten worden
    vastgelegd in een nieuwe ADR of door de status te wijzigen naar `Superseded`.
