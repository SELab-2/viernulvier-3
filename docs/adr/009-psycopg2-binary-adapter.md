# ADR-009: Keuze PostgreSQL Database Adapter: psycopg2-binary

**Status:** Accepted **Datum:** 2026-02-22

## Context

SQLAlchemy heeft een database-adapter (driver) nodig om te communiceren met de
PostgreSQL-instantie. De driver zorgt voor de verbinding op laag niveau, het
vertalen van data-typen en het uitvoeren van de queries die door SQLAlchemy
worden gegenereerd. De driver moet eenvoudig te installeren zijn in een
Docker-container.

## Beslissing

We gebruiken **psycopg2-binary** als de database driver.

## Argumenten

- **Stabiliteit:** `psycopg2` is de standaard driver voor Python en PostgreSQL
  en is zeer robuust.
- **Ondersteuning:** Het is de meest geteste en gebruikte driver in combinatie
  met SQLAlchemy.
- **Snelheid:** Omdat het een wrapper rond een C-bibliotheek is, biedt het
  uitstekende performance voor standaard database-interacties.

## Gevolgen

- De `requirements.txt` van de backend moet `psycopg2-binary` bevatten.
