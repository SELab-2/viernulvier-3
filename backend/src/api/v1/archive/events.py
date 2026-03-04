from fastapi import APIRouter

router = APIRouter()


@router.get("/{event_id}")
async def get_event(event_id: int) -> dict:
    # Tijdelijke fix om geen probleem met linter te hebben
    if event_id:
        pass
