from fastapi import APIRouter

router = APIRouter()


@router.get("/event/{event_id}")
def get_event(event_id: int) -> dict:
    pass
    # return db.get_event(event_id)