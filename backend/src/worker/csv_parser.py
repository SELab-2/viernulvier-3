import csv
import logging

from src.models.hall import Hall
from src.models.tag import Tag, TagName
from src.services.language import Languages
from src.worker.converters.production import csv_prod_to_model_prod
from src.worker.converters.event import csv_event_to_model_event
from src.database import SESSION_LOCAL

logging.basicConfig(
    level=logging.DEBUG,
    format="[%(levelname)s %(asctime)s] %(message)s",
)

logger = logging.getLogger(__name__)

prod_file = "src/data/Productions - output.csv"
event_file = "src/data/Events - voorstellingen.csv"

producties = dict()
events = dict()

logger.info("Loading production csv")
# Productions
with open(prod_file, newline="", encoding="utf-8") as f:
    reader = csv.reader(f)
    # Skip header
    next(reader)
    for row in reader:
        # Sla alle entries met onnuttige data over
        if len(row) == 7 and row[5] != "" and row[0] != "":
            producties[row[5]] = row

logger.info("Loading event csv")
# Events
with open(event_file, newline="", encoding="utf-8") as f:
    reader = csv.reader(f)
    # Skip header
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

# Get all tagnames
tag_name_models = db.query(TagName).all()
tag_map = {}
for tag_name in tag_name_models:
    tag_map[tag_name.name] = tag_name.tag

try:
    nl_lang_id = None
    logger.info("Start adding data")
    production_count, event_count, hall_count, tag_count = 0, 0, 0, 0
    for prod_id, productie in producties.items():
        genres = productie[4]
        genres = genres.split(",")
        for genre in genres:
            if genre not in tag_map:
                logger.info(f"tag '{genre}' no found, adding it")
                tag_model = Tag(viernulvier_use="genre")
                db.add(tag_model)
                db.flush()
                tag_id = tag_model.id
                tag_name_model = TagName(
                    tag_id=tag_id, language=Languages.NEDERLANDS, name=genre
                )
                db.add(tag_name_model)
                db.flush()
                tag_map[genre] = tag_id

        production_model = csv_prod_to_model_prod(productie, tag_map)
        db.add(production_model)
        production_count += 1
        db.flush()
        if prod_id in events:
            for event in events[prod_id]:
                if event[2] in hall_map:
                    hall_id = hall_map[event[2]]
                else:
                    logger.info(f"hall '{event[2]}' not found, adding it")
                    hall_model = Hall(name=event[2])
                    db.add(hall_model)
                    db.flush()
                    hall_count += 1
                    hall_id = hall_model.id
                    hall_map[event[2]] = hall_id
                event_model = csv_event_to_model_event(
                    production_model.id, event, hall_id
                )
                db.add(event_model)
                event_count += 1
        db.commit()
    logger.info(f"{production_count} productions added")
    logger.info(f"{event_count} events added")
    logger.info(f"{hall_count} halls added")
finally:
    db.close()
    logger.info("Connection with database closed")
