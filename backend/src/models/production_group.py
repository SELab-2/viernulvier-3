"""SQLAlchemy-model voor deelbare productiecollecties."""

from sqlalchemy import Boolean, Column, Integer, String
from sqlalchemy.orm import relationship
from sqlalchemy.sql.expression import true

from src.database import Base
from src.models.associations import prod_groups


class ProductionGroup(Base):
    __tablename__ = "production_groups"

    id = Column(Integer, primary_key=True, autoincrement=True)
    title = Column(String, nullable=False)
    is_public_filter = Column(
        Boolean,
        nullable=False,
        default=True,
        server_default=true(),
    )

    productions = relationship(
        "Production",
        secondary=prod_groups,
        back_populates="groups",
    )
