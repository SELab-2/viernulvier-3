from sqlalchemy.orm import Session
from src.models.history import History

DEFAULT_HISTORY = [
    {"year": 2020, "language": "nl", "title": "Start project", "content": "Project werd opgestart."},
    {"year": 2020, "language": "en", "title": "Project start", "content": "Project was started."},
    {"year": 2021, "language": "nl", "title": "Eerste release", "content": "Eerste versie live."},
]


def seed_history_if_empty(session: Session):
    exists = session.query(History.id).first()
    if exists:
        print("History already seeded")
        return

    print("Seeding history table...")
    for row in DEFAULT_HISTORY:
        session.add(History(**row))

    session.commit()