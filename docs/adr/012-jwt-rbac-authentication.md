# ADR-012: JWT-gebaseerde authenticatie met RBAC

**Status:** Accepted
**Datum:** 2026-03-11

## Context

De backend bevat beheerde archiefbewerkingen die niet publiek toegankelijk
mogen zijn. We hadden een authenticatie- en autorisatiestrategie nodig die:

- werkt in een containergebaseerde, stateless webstack
- eenvoudig te gebruiken is vanuit de frontend
- fijnmazige toegangscontrole toelaat voor verschillende beheeracties

De relevante alternatieven waren klassieke server-side sessies of een
tokengebaseerde aanpak met rollen en permissies.

## Beslissing

We gebruiken JSON Web Tokens voor authenticatie en een role-based access control
model met expliciete permissies voor autorisatie.

Concreet betekent dit:

- login levert een access token en een refresh token op
- beveiligde endpoints gebruiken Bearer-authenticatie
- rollen groeperen permissies
- permissies worden op endpointniveau afgedwongen via dependencies

## Argumenten

- **Stateless requests:** de backend hoeft geen server-side sessiestore te
  beheren.
- **Fijnmazige controle:** permissies zoals `archive:create` en `users:read`
  maken het eenvoudiger om beheeracties af te bakenen dan alleen ruwe rollen.
- **Schaalbaarheid:** meerdere backend-instances kunnen dezelfde JWT-strategie
  gebruiken zolang ze dezelfde secret delen.
- **Eenvoudige evolutie:** nieuwe domeinen kunnen extra permissies toevoegen
  zonder het volledige auth-model te herwerken.

## Gevolgen

- De databank bevat tabellen voor gebruikers, rollen, permissies en hun
  many-to-many-relaties.
- Omgevingsconfiguratie moet een `JWT_SECRET_KEY` en algoritme bevatten.
- Clients moeten access tokens meesturen op beveiligde requests en refresh
  tokens gebruiken om access tokens te vernieuwen.
- Wijzigingen aan rollen of permissies vereisen aandacht voor tokeninhoud en
  endpointbeveiliging.
