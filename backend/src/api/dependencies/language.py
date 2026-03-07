
from fastapi import Header

from src.services.languages import Languages


def get_accepted_language(accept_language: str = Header(None, alias="Accept-Language")) -> str:
    if not accept_language:
        return Languages.ENGLISH

    # Parse de header (bijv. "en-US,en;q=0.9,nl;q=0.8")
    languages = [lang.split(";")[0].strip() for lang in accept_language.split(",")]

    supported = Languages.all()
    for lang in languages:
        if lang.lower() in ["en", "english"]:
            return Languages.ENGLISH
        elif lang.lower() in ["nl", "nederlands", "dutch"]:
            return Languages.NEDERLANDS

    return Languages.ENGLISH