"""SQLAlchemy-model voor blogs"""

from sqlalchemy import Column, ForeignKey, Integer, String
from sqlalchemy.orm import relationship

from src.database import Base
from src.models.associations import prod_blogs


class Blog(Base):
    __tablename__ = "blogs"
    id = Column(Integer, primary_key=True, autoincrement=True)
    title = Column(String)
    content = Column(String)

    author_id = Column(Integer, ForeignKey("users.id"))
    author = relationship("User", back_populates="blogs")

    productions = relationship(
        "Production",
        secondary=prod_blogs,
        back_populates="blogs",
    )

    media = relationship("Media", back_populates="blog")
