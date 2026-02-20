# Keuze Backend API: FastAPI

**Status:** Accepted  
**Datum:** 2026-02-14  

## Context
We moeten een schaalbare en onderhoudbare backend bouwen voor het archief van VIERNULVIER. De API moet snel te ontwikkelen zijn, makkelijk te documenteren, makkelijk te onderhouden, en input validatie moet betrouwbaar gebeuren om fouten bij de klant te voorkomen.

## Beslissing
We gebruiken **FastAPI (Python)** als backend framework voor de API.  

## Argumenten
- **Onderhoud:** Python is leesbaar, goed gedocumenteerd en makkelijk over te dragen naar andere ontwikkelaars of de klant. Python is ook een van de meest gebruikte talen (2026) dus een onderhouder vinden zal makkelijker zijn.
- **Kwaliteit:** FastAPI valideert automatisch inkomende API requests en voorkomt ongeldige data.  
- **Productiviteit:** Snelle ontwikkeling dankzij moderne features en type hints.  
- **Documentatie:** Geïntegreerde Swagger/OpenAPI-documentatie bespaart tijd.

## Gevolgen
- De backend development richt zich volledig op Python + FastAPI.  
- Eventuele frontend- of databasekeuzes moeten compatibel zijn met python/FastAPI endpoints.  
- Toekomstige wijzigingen in de API moeten opnieuw worden vastgelegd in een nieuwe ADR of door de status te wijzigen naar `Superseded`.
