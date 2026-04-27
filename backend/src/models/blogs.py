"""SQLAlchemy-model voor blogs"""

from sqlalchemy import Column, ForeignKey, Integer, String
from sqlalchemy.orm import relationship

from src.database import Base
from src.models.associations import prod_blogs


class Blog(Base):
    __tablename__ = "blogs"
    id = Column(Integer, primary_key=True, autoincrement=True)

    author_id = Column(Integer, ForeignKey("users.id"))
    author = relationship("User", back_populates="blogs")

    productions = relationship(
        "Production",
        secondary=prod_blogs,
        back_populates="blogs",
    )

    media = relationship("Media", back_populates="blog")


class BlogContent(Base):
    __tablename__ = "blog_content"

    blog_id = Column(Integer, ForeignKey("blogs.id"), primary_key=True)
    language = Column(String, primary_key=True)
    title = Column(String)
    content = Column(String)
