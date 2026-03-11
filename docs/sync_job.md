# Synchronisatie script
## Doel
Om de data in het archief up-to-date te houden moet er regelmatig nieuwe data
opgehaald worden uit de viernulvier API.

Dit script is hiervoor verantwoordelijk. Het werkt dagelijks één keer, haalt
de data op en slaat deze op in de archief databank.

Verder wordt dit script ook gebruikt om initiëel het archief te vullen met
historische data die via de API beschikbaar is.


## Hoe uitvoeren
Het script heeft een API key nodig, dit zit in het `.env` bestand in de root
van het project. Deze wordt al uitgelezen door `backend/src/config.py`, dus
deze code kunnen we hergebruiken. Om Python's imports te laten werken moet
het script uitgevoerd worden vanuit de `backend/` folder met het volgende
commando:
```sh
python -m src.worker.sync_job
```

Dit allemaal verloopt het best in de docker containers (zodat de databank
klaar staat):
```sh
docker compose run --rm sync_job
```


## Uitdagingen
Het is uitermate belangrijk dat er bij het synchroniseren geen data verloren
gaat; zowel voor nieuwe data als updates van data.

### Eerste synchronisatie
Bij de eerste synchronisatie zal dit gaan om een enorme hoeveelheid data die
hoogstwaarschijnlijk door rate-limits in meerdere keren zal moeten opgehaald
worden. Het script moet hier mee kunnen omgaan en dus partiële updates
ondersteunen:
```
fetch -> partial data -> partial store -> wait -> continue from checkpoint
```

Techisch detail: de API ondersteunt het opvragen van data na een bepaalde
datum, en als er te veel items zijn, dan geeft die deze terug in pagina's.
Als er bijvoorbeeld 83 items zijn na een gegeven datum, dan zal de API dit
vermelden in het antwoord, maar slechts de eerste 30 teruggeven. De volgende
30 kunnen opgevraagd worden met de parameter `page=2` en de laatste 23 items
met `page=3`.
(Alle producties samen zijn 2613 items nu, nog een meervoud daarvan voor het
aantal events.)

Als we aannemen dat de API altijd de data gesorteerd per oplopende timestamp
teruggeeft, dan kan het script pagina per pagina werken. Dit lijkt uit
experimentele data ook te kloppen, de resultaten uit de API zijn altijd
oplopend gesorteerd.

Een alternatief zou zijn om dag per dag op te vragen, maar ook hier kan het
fout lopen. Als er een garantie is dat de data gesorteerd is per timestamp,
dan is het robuuster te werken met pagina's.


### Dagelijkse synchronisatie
Het is belangrijk te weten wat de timestamp is van het laatst opgeslagen item
om van daaruit nieuwe data te kunnen ophalen. Idem voor het laatst geupdate
item.

Met deze `most-recent` timestamp kan het script dan de API bevragen met
de parameter `created_at[after]: ...`. Er is ook een `created_at[after_strict]`,
maar deze zou theoretisch gezien een probleem geven wanneer er twee items
waren met exact dezelfde timestamp, maar het tweede item paste niet meer op
dezelfde pagina als het eerste, en er liep iets mis voor die volgende pagina.
Voor de veiligheid zal het script dus die kleine overlap ook opvragen, de
databank zal er voor zorgen dat er geen dubbele items opgeslagen worden via
restricties op uniekheid.


## `sync_job` architectuur
De padnamen laten steeds `backend/src/worker/` weg.

Het entry-point van de sync-joc is `sync_job.py`. Hierin staan de verschillende
resources (`Production`, `Event`, ...) opgelijst die gesynchroniseerd moeten
worden.
Per resource wordt er een nieuwe viernulvier-api-wrapper (`VNV_Wrapper`)
aangemaakt (dus een nieuwe verbinding met de viernulvier server).
Dan wordt het werk overgedragen aan de `sync/` folder. Hierin zal `sync/sync_new.py`
de stappen orchestreren:
- opvragen van laatste gesynchroniseerde timestamp aan de archief databank (`db_sync.py`)
- ophalen van data van de api via gepagineerde fetchers (`fetchers/*`)
- converteren van json api response naar databank objecten (`converters/*`)
- databank objecten opslaan in de databank (`sync/store/*`)
- nieuwe laatste timestamp in databank opslaan (`sync/db_sync.py`)
