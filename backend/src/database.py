from sqlalchemy import (
    Column, Integer, String, Text, VARCHAR, DECIMAL, TIMESTAMP, ForeignKey, ForeignKeyConstraint
)
from sqlalchemy.orm import declarative_base, relationship

Base = declarative_base()


class Language(Base):
    __tablename__ = "language"

    id = Column(Integer, primary_key=True)
    language = Column(VARCHAR)


class Gallery(Base):
    __tablename__ = "gallery"

    id = Column(Integer, primary_key=True)
    media = Column(Text)


class Production(Base):
    __tablename__ = "productions"

    id = Column(Integer, primary_key=True)
    performer_type = Column(VARCHAR)
    attendance_mode = Column(VARCHAR)
    media_gallery_id = Column(Integer, ForeignKey("gallery.id"))
    created_at = Column(TIMESTAMP)
    updated_at = Column(TIMESTAMP)

    gallery = relationship("Gallery")
    info = relationship("ProdInfo", back_populates="production")
    tags = relationship("Tag", secondary="prod_tags", back_populates="productions")
    genres = relationship("Genre", secondary="prod_genres", back_populates="productions")
    events = relationship("Event", back_populates="production")


class ProdInfo(Base):
    __tablename__ = "prod_info"

    production_id = Column(Integer, ForeignKey("productions.id"), primary_key=True)
    language_id = Column(Integer, ForeignKey("language.id"), primary_key=True)
    title = Column(VARCHAR)
    supertitle = Column(VARCHAR)
    artist = Column(VARCHAR)
    tagline = Column(VARCHAR)
    teaser = Column(VARCHAR)
    description = Column(Text)
    info = Column(Text)

    production = relationship("Production", back_populates="info")
    language = relationship("Language")


class Genre(Base):
    __tablename__ = "genres"

    id = Column(Integer, primary_key=True)

    names = relationship("GenreName", back_populates="genre")
    productions = relationship("Production", secondary="prod_genres", back_populates="genres")


class GenreName(Base):
    __tablename__ = "genre_names"

    genre_id = Column(Integer, ForeignKey("genres.id"), primary_key=True)
    language_id = Column(Integer, ForeignKey("language.id"), primary_key=True)
    name = Column(VARCHAR)

    genre = relationship("Genre", back_populates="names")
    language = relationship("Language")


class Tag(Base):
    __tablename__ = "tags"

    id = Column(Integer, primary_key=True)
    name = Column(VARCHAR)

    names = relationship("TagName", back_populates="tag")
    productions = relationship("Production", secondary="prod_tags", back_populates="tags")


class TagName(Base):
    __tablename__ = "tag_names"

    tag_id = Column(Integer, ForeignKey("tags.id"), primary_key=True)
    language_id = Column(Integer, ForeignKey("language.id"), primary_key=True)
    name = Column(VARCHAR)

    tag = relationship("Tag", back_populates="names")
    language = relationship("Language")


class ProdTag(Base):
    __tablename__ = "prod_tags"

    tag_id = Column(Integer, ForeignKey("tags.id"), primary_key=True)
    prod_id = Column(Integer, ForeignKey("productions.id"), primary_key=True)


class ProdGenre(Base):
    __tablename__ = "prod_genres"

    genre_id = Column(Integer, ForeignKey("genres.id"), primary_key=True)
    prod_id = Column(Integer, ForeignKey("productions.id"), primary_key=True)


class Hall(Base):
    __tablename__ = "halls"

    id = Column(Integer, primary_key=True)
    address = Column(VARCHAR)
    name = Column(VARCHAR)

    events = relationship("Event", back_populates="hall")


class Event(Base):
    __tablename__ = "events"

    id = Column(Integer, primary_key=True)
    production_id = Column(Integer, ForeignKey("productions.id"))
    hall_id = Column(Integer, ForeignKey("halls.id"))
    starts_at = Column(TIMESTAMP)
    ends_at = Column(TIMESTAMP)
    order_url = Column(VARCHAR)
    external_order_url = Column(VARCHAR)
    created_at = Column(TIMESTAMP)
    updated_at = Column(TIMESTAMP)

    production = relationship("Production", back_populates="events")
    hall = relationship("Hall", back_populates="events")
    prices = relationship("EventPrice", back_populates="event")


class EventPrice(Base):
    __tablename__ = "event_prices"

    id = Column(Integer, primary_key=True)
    event_id = Column(Integer, ForeignKey("events.id"))
    label = Column(VARCHAR)
    amount = Column(DECIMAL)
    available = Column(Integer)
    expires_at = Column(TIMESTAMP)
    created_at = Column(TIMESTAMP)
    updated_at = Column(TIMESTAMP)

    event = relationship("Event", back_populates="prices")


from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

DATABASE_URL = "postgresql://postgres:postgres@localhost:5432/viernulvier"

engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(bind=engine)