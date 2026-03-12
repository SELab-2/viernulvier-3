from sqlalchemy import Column, Integer, String
from sqlalchemy.orm import relationship
from src.database import Base
from src.models.associations import role_permissions


class Permission(Base):
    """Specifieke actie of toegang (bijv. 'archive:create')."""

    __tablename__ = "permissions"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, index=True, nullable=False)

    roles = relationship(
        "Role", secondary=role_permissions, back_populates="permissions"
    )
