from src.schemas.base_schema import StrictModel


class ArtistsResponse(StrictModel):
    en: list[str]
    nl: list[str]
