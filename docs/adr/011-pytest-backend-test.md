# ADR-011 pytest backend testing

**Status:** Proposed
**Datum:** 2026-02-22

## Context

We hebben een betrouwbaar en schaalbaar testframework nodig om te zorgen dat al
onze code blijft werken. Dit testframework moet kunnen omgaan met alle andere
frameworks in onze backend en we moeten er kwaliteitsvolle testen in kunnen schrijven.

## Beslissing

We gebruiken *Pytest* als framework voor het testen van de backend.

## Argumenten

- **Betrouwbaarheid**: Het is een van de meest gebruikte frameworks om te testen in python.
- **Gebruiksgemak**: Na setup is het zeer eenvoudig om testen hiervoor te schrijven. Pytest zoekt zelf naar alle bestanden die met `test_` starten en voert de functies erin uit.
- **Grote schaal** Pytest heeft veel plugins die voor veel types testen kunnen zorgen.

## Gevolgen

- Er moet wat setup gedaan worden om de testen te laten werken met de databank.
- De endpoints moeten een bepaalde opbouw hebben om unit tests toe te staan.
- pytest moet lokaal geïnstalleerd worden.
