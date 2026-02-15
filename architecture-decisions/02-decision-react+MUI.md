# Keuze Frontend: React + MUI

**Status:** Accepted  
**Datum:** 2026-02-15  

## Context
We moeten een moderne, gebruiksvriendelijke en onderhoudbare frontend bouwen voor het VIERNULVIER-archief. Het team bestaat uit informatici zonder uitgebreide designervaring. De frontend moet makkelijk te onderhouden zijn, responsive zijn en er modern uitzien zonder veel custom design werk.

## Beslissing
We gebruiken **React** als frontend framework en **MUI (Material UI)** als componentenbibliotheek.  

## Argumenten
- **Snelle ontwikkeling:** React biedt een snelle dev-omgeving en eenvoudige componentstructuur.  
- **Modern UI out-of-the-box:** MUI biedt kant-en-klare, moderne componenten (buttons, forms, tables, dialogs) die makkelijk aanpasbaar zijn.  
- **Design-vriendelijk voor devs:** We hoeven geen custom CSS-framework te bouwen; MUI zorgt voor consistente styling en responsive layouts.  
- **Onderhoudbaar:** React componenten zijn modulair, herbruikbaar en goed te testen.  
- **Documentatie:** Zowel React als MUI hebben uitgebreide documentatie en community-ondersteuning.  

## Consequenties
- Het design blijft eenvoudig en consistent dankzij MUI-componenten.  
- Voor specifieke styling kunnen we MUI’s theming gebruiken, zonder van nul te moeten ontwerpen.  
- Developers kunnen redelijk snel features bouwen zonder diep in UI/UX design te duiken.  
- Eventuele toekomstige UI-upgrades kunnen eenvoudig doorgevoerd worden via MUI-thema’s of component updates.
