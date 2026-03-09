import logging

from src.worker.api_wrapper.vnv_wrapper import VNV_Wrapper
from src.worker.api_wrapper.production import ProductionFetcher
from src.worker.api_wrapper.event import EventFetcher


# Logging is used in the other classes, but seeing as this file is the main
# one, setting the config here feels appropriate.
# Currently it logs to stdout, but when this script runs periodically
# we might want to save it to a file.
logging.basicConfig(
    # filename="sync_job.log", filemode="w",
    level=logging.DEBUG,
    format="[%(levelname)s %(asctime)s] %(message)s"
)


if __name__ == "__main__":
    # This code does not do anything productive yet, but is here to kinda show
    # how the classes inside `api_wrapper/` can be used.

    with VNV_Wrapper() as wrapper:
        prod_fetcher = ProductionFetcher(wrapper)
        # print(
        prod_fetcher.get_new_productions_after("2026-02-01T00:00:00Z")[0]
        # )

        event_fetcher = EventFetcher(wrapper)
        # print(
        event_fetcher.get_new_events_after("2026-02-01T00:00:00Z")[-1]
        # )
