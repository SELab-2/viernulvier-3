from sqlalchemy import text
from sqlalchemy.orm import Session
from src.schemas.status import ComponentStatus, HealthResponse


def get_health(db: Session) -> HealthResponse:
    """Check the health of the API and its database connection."""
    try:
        db.execute(text("SELECT 1"))
        db_status = ComponentStatus.OK
        detail = None
    except Exception as exc:
        db_status = ComponentStatus.ERROR
        detail = str(exc)

    overall_status = ComponentStatus.OK
    
    # If any check is not OK, change overall_status to ERROR
    # Add later checks here if needed
    if db_status != ComponentStatus.OK:
        overall_status = ComponentStatus.ERROR

    return HealthResponse(status=overall_status, database=db_status, detail=detail)
