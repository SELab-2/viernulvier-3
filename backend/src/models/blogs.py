"""SQLAlchemy-model voor blogs"""

from sqlalchemy import Column, ForeignKey, Integer, String
from sqlalchemy.orm import relationship

from src.database import Base


class Blog(Base):
    __tablename__ = "blogs"
    id = Column(Integer, primary_key=True, autoincrement=True)
    production_group_id = Column(
        Integer, ForeignKey("production_groups.id"), nullable=True
    )

    media = relationship("Media", back_populates="blog")
    contents = relationship("BlogContent", back_populates="blog")
    production_group = relationship("ProductionGroup", back_populates="blogs")


class BlogContent(Base):
    __tablename__ = "blog_content"

    blog_id = Column(Integer, ForeignKey("blogs.id"), primary_key=True)
    language = Column(String, primary_key=True)
    title = Column(String)
    content = Column(String)
    blog = relationship("Blog", back_populates="contents")
