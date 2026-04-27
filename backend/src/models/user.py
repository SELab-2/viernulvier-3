from datetime import datetime, timezone

from sqlalchemy import Boolean, Column, DateTime, Integer, String
from sqlalchemy.orm import relationship
from src.database import Base
from src.models.associations import user_roles


class User(Base):
    """Gebruiker (User) met rollen en inloginformatie."""

    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    token_version = Column(Integer, nullable=False, default=0)
    super_user = Column(Boolean, nullable=False, default=False)
    created_at = Column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc)
    )
    last_login_at = Column(DateTime(timezone=True), nullable=True)

    roles = relationship(
        "Role", secondary=user_roles, back_populates="users", lazy="joined"
    )
