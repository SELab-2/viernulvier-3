import csv
import logging

from src.models.language import Language
from src.models.hall import Hall
from src.worker.converters.production import csv_prod_to_model_prod
from src.worker.converters.event import csv_event_to_model_event
from src.database import SESSION_LOCAL

logger = logging.getLogger(__name__)

prod_file = "src/worker/Productions - output.csv"
event_file = "src/worker/Events - voorstellingen.csv"

producties = dict()
events = dict()

logger.info("Loading csvs")
# Productions
with open(prod_file, newline="", encoding="utf-8") as f:
    reader = csv.reader(f)
    next(reader)
    for row in reader:
        # Sla alle entries met onnuttige data over
        if len(row) == 7 and row[5] != "" and row[0] != "":
            producties[row[5]] = row

# Events
with open(event_file, newline="", encoding="utf-8") as f:
    reader = csv.reader(f)
    next(reader)
    for row in reader:
        # Sla alle entries met onbestaande producties over
        if row[3] in producties:
            if row[3] in events:
                events[row[3]].append(row)
            else:
                events[row[3]] = [row]

db = SESSION_LOCAL()
logger.info("Connection with database created")

# Get all halls
hall_models = db.query(Hall).all()
hall_map = {}
for hall in hall_models:
    hall_map[hall.name] = hall.id

try:
    nl_lang_id = None
    languages = db.query(Language).all()
    for lang in languages:
        if lang.language == "nl":
            nl_lang_id = lang.id
    if nl_lang_id is None:
        raise RuntimeError("Language 'nl' not found.")
    c = 0
    for prod_id, productie in producties.items():
        production_model = csv_prod_to_model_prod(productie, nl_lang_id)
        db.add(production_model)
        db.flush()
        if prod_id in events:
            for event in events[prod_id]:
                if event[2] in hall_map:
                    hall_id = hall_map[event[2]]
                else:
                    hall_model = Hall(name=event[2])
                    db.add(hall_model)
                    db.flush()
                    hall_id = hall_model.id
                    hall_map[event[2]] = hall_id
                event_model = csv_event_to_model_event(
                    production_model.id, event, hall_id, c
                )
                db.add(event_model)
                c += 1
        db.commit()
finally:
    db.close()
    logger.info("Connection with database closed")
