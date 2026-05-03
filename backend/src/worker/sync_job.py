import logging

from src.database import SESSION_LOCAL
from src.models.sync_state import ResourceType
from src.worker.fetchers.event import EventFetcher
from src.worker.fetchers.eventprice import EventPriceFetcher
from src.worker.fetchers.paged_fetcher import PagedFetcher
from src.worker.fetchers.production import ProductionFetcher
from src.worker.fetchers.genres import GenreFetcher
from src.worker.sync.sync_new import sync_new_items
from src.worker.vnv_wrapper import VNV_Wrapper

from src.worker.sync.store.production import store_new_productions
from src.worker.sync.store.media import sync_all_media


# Logging is used in the other classes, but seeing as this file is the main
# one, setting the config here feels appropriate.
# Currently it logs to stdout, but when this script runs periodically
# we might want to save it to a file.
logging.basicConfig(
    # filename="sync_job.log", filemode="w",
    level=logging.DEBUG,
    format="[%(levelname)s %(asctime)s] %(message)s",
)

logger = logging.getLogger(__name__)


# The order in which to sync is defined here. If one type relies (via Foreign
# Key constraints) on another, it should appear after the other in this list.
SYNC_ORDER: list[tuple[ResourceType, PagedFetcher]] = [
    (ResourceType.GENRES, GenreFetcher),
    (ResourceType.PRODUCTION, ProductionFetcher),
    (ResourceType.EVENT, EventFetcher),
    (ResourceType.EVENT_PRICES, EventPriceFetcher),
]


def sync_all():
    db = SESSION_LOCAL()
    logger.info("connection with database created")

    try:
        for resource_type, fetcher_class in SYNC_ORDER:
            # New wrapper because otherwise the api behaves strange when
            # fetching a lot of data. Strang api...
            with VNV_Wrapper() as wrapper:
                fetcher = fetcher_class(wrapper)
                sync_new_items(db, fetcher, resource_type)
                # And later:
                # sync_updated_items(db, lang_map, fetcher, resource_type)
            
        logger.info("Starting media sync")
        with VNV_Wrapper() as wrapper:
            sync_all_media(db, wrapper)
        logger.info("Media sync complete")

    finally:
        db.close()
        logger.info("connection with database closed")

def sync_one_production(production_id: int):
    db = SESSION_LOCAL()
    logger.info(f"Syncing single production vnv_id={production_id}")
    try:
        with VNV_Wrapper() as wrapper:
            json_prod = wrapper.GET(f"/productions/{production_id}")
            store_new_productions(db, [json_prod])
            db.commit()

        with VNV_Wrapper() as wrapper:
            sync_all_media(db, wrapper)
        db.commit()

        logger.info(f"Done syncing production vnv_id={production_id}")
    finally:
        db.close()
        logger.info("connection with database closed")


if __name__ == "__main__":
    import sys
    if len(sys.argv) == 2:
        sync_one_production(int(sys.argv[1]))
    else:
        sync_all()
