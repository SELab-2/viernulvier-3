from src.worker.api_wrapper.vnv_wrapper import VNV_Wrapper
from src.worker.api_wrapper.production import ProductionFetcher
from src.worker.api_wrapper.event import EventFetcher


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
