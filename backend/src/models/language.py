"""SQLAlchemy-model voor talen."""

from sqlalchemy import Column, Integer, String
from src.database import Base


class Language(Base):
    __tablename__ = "language"

    id = Column(Integer, primary_key=True)
    language = Column(String)
