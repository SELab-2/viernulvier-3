from fastapi import APIRouter

router = APIRouter()


@router.get("/{production_id}")
async def get_event(production_id: int) -> dict:
    pass
