from fastapi import APIRouter

router = APIRouter()

@router.get("/{event_id}")
async def get_event(event_id: int) -> dict:
    pass
