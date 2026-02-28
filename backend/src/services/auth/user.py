from typing import Optional
from sqlalchemy.orm import Session

from src.models.user import User


def get_user(db: Session, username: str) -> Optional[User]:
    return db.query(User).filter(User.username == username).first()
