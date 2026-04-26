from sqlalchemy import Column, Integer, String, Text, UniqueConstraint
from src.database import Base


class History(Base):
    __tablename__ = "history"

    id = Column(Integer, primary_key=True, autoincrement=True)

    year = Column(Integer, nullable=False)

    # 'nl', 'en'
    language = Column(String(5), nullable=False)

    title = Column(String)
    content = Column(String, nullable=False)

    __table_args__ = (
        UniqueConstraint("year", "language", name="uix_year_language"),
    )
