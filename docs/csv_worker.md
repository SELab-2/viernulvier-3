# CSV Worker

De csv worker is geschreven om één keer uitgevoerd te worden om de meegeleverde
csv bestanden in te laden in onze databank. Daarna is deze niet meer nodig.

Het is uitermate belangrijk dat deze csv worker wordt uitgevoerd NADAT de sync
worker minstens één keer is uitgevoerd, om te zorgen dat de juiste halls al
aanwezig zijn in de databank. Anders kan de csv worker halls aanmaken die de
sync worker later ook wil aanmaken, en dan zijn de `viernulvier_id`s niet in
orde.


## Hoe uitvoeren

Het script verwacht de csv bestanden onder `backend/src/data/`:
```
backend/src/data/Events - voorstellingen.csv
backend/src/data/Productions - output.csv
```

Om het uit te voeren:
```sh
docker compose up --build -d --wait
docker compose --profile csv build
docker compose --profile csv run --rm csv_worker
```
