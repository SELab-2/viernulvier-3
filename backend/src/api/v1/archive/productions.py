from fastapi import APIRouter

router = APIRouter()


@router.get("/{production_id}")
async def get_event(production_id: int) -> dict:
    # Tijdelijke fix om geen probleem met linter te hebben
    if production_id:
        pass
    return {}
