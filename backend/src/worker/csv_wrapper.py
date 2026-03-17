import csv
import logging

from src.worker.converters.production import csv_prod_to_model_prod
from src.worker.converters.event import csv_event_to_model_event
from src.database import SESSION_LOCAL

logger = logging.getLogger(__name__)

prod_file = "Productions - output.csv"
event_file = "Events - voorstellingen.csv"

producties = dict()
events = dict()

logger.info("Loading csvs")
# Productions
with open(prod_file, newline="", encoding="utf-8") as f:
    reader = csv.reader(f)
    for row in reader:
        # Sla alle entries met onnuttige data over
        if len(row) == 7 and row[5] != "" and row[0] != "":
            producties[row[5]] = row

# Events
with open(event_file, newline="", encoding="utf-8") as f:
    reader = csv.reader(f)
    for row in reader:
        # Sla alle entries met onbestaande producties over
        if row[3] in producties:
            if row[3] in events:
                events[row[3]].append(row)
            else:
                events[row[3]] = [row]

db = SESSION_LOCAL()
logger.info("Connection with database created")

try:
    for prod_id, productie in producties.items():
        # Get nl_lang_id
        production_model = csv_prod_to_model_prod(prod_id, productie, 0)
        db.merge(production_model)
        for event in events[prod_id]:
            event_model = csv_event_to_model_event(event)
            db.merge(event_model)
finally:
    db.close()
    logger.info("Connection with database closed")
