from fastapi import APIRouter

router = APIRouter()


@router.get("/production/{production_id}")
def get_event(production_id: int) -> dict:
    pass
    # return db.get_production(production_id)