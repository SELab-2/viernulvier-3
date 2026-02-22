# ADR-008: Keuze ORM: SQLAlchemy

**Status:** Accepted **Datum:** 2026-02-22

## Context

Bij het werken met een relationele databank (PostgreSQL) is het nodig om
database-records te mappen naar Python-objecten. Manuele SQL-queries in de code
kunnen leiden tot fouten, zijn minder onderhoudbaar en bieden minder
types-safety. We hebben een abstractielaag nodig die het datamodel beheert en
queries vereenvoudigt.

## Beslissing

We gebruiken **SQLAlchemy** als de Object-Relational Mapper (ORM) voor het
project.

## Argumenten

- **Flexibiliteit:** Het ondersteunt zowel high-level ORM-functionaliteit als
  low-level SQL-queries via SQLAlchemy Core indien dat nodig is voor
  performance-redenen.
- **Volwassenheid:** Het is de meest gebruikte en best gedocumenteerde ORM voor
  Python.
- **Integratie:** Werkt uitstekend samen met FastAPI en Pydantic.
- **Database-agnostisch:** De data-definities in Python kunnen makkelijk worden
  overgezet naar andere databanken mocht PostgreSQL in de toekomst vervangen
  worden.
- **Ecosysteem:** Veel tools (zoals Alembic voor migraties) zijn specifiek
  gebouwd rond SQLAlchemy.

## Gevolgen

- Database-entiteiten worden gedefinieerd als SQLAlchemy-modellen in Python.
- Ontwikkelaars moeten de SQLAlchemy-syntax leren voor het maken van queries en
  relaties.
