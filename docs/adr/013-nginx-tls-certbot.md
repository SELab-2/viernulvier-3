# ADR-013: TLS-terminatie via Nginx met Certbot

**Status:** Accepted
**Datum:** 2026-03-11

## Context

De applicatie wordt publiek aangeboden via een reverse proxy. Voor productie
moesten we beslissen waar TLS-terminatie gebeurt en hoe certificaten beheerd en
vernieuwd worden.

De belangrijkste opties waren:

1. TLS volledig buiten de Compose-stack beheren
2. TLS in de Nginx-proxy afhandelen en certificaatbeheer in dezelfde deployment
   opnemen

## Beslissing

We laten de productieproxy TLS termineren in Nginx en gebruiken een aparte
`certbot`-container voor Let's Encrypt-certificaatvernieuwing.

## Argumenten

- **Duidelijke scheiding van verantwoordelijkheden:** Nginx behandelt inkomend
  webverkeer, Certbot beheert certificaten.
- **Eenvoudige integratie met de bestaande proxy:** dezelfde reverse proxy kan
  zowel routing als HTTPS-afhandeling doen.
- **Automatiseerbare vernieuwing:** certificaten kunnen via een aparte
  container periodiek vernieuwd worden.
- **Beperkte impact op backend en frontend:** de achterliggende services blijven
  intern HTTP spreken binnen het Docker-netwerk.

## Gevolgen

- Productie gebruikt een aparte Nginx-configuratie naast de lokale HTTP-config.
- Er zijn extra volumes nodig voor ACME challenges en certificaatopslag.
- Poort `443` wordt in productie publiek blootgesteld naast poort `80`.
- De deployment veronderstelt een initiële certificaatuitgifte voordat de
  automatische renew-lus haar werk kan doen.
