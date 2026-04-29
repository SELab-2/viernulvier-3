from sqlalchemy import Column, Integer, String
from src.database import Base


class History(Base):
    __tablename__ = "history"

    year = Column(Integer, primary_key=True)

    # 'nl', 'en'
    language = Column(String, primary_key=True)

    title = Column(String)
    content = Column(String, nullable=False)
