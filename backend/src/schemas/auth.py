from datetime import datetime
from typing import List, Optional

from pydantic import BaseModel, ConfigDict, Field


class UserBase(BaseModel):
    username: str


class UserResponse(UserBase):
    model_config = ConfigDict(from_attributes=True)

    id_url: int
    super_user: bool
    roles: List[str]
    permissions: List[str]
    created_at: datetime
    last_login_at: Optional[datetime] = None


class UserCreate(UserBase):
    password: str
    roles: List[str] = Field(default_factory=list)


class UserReplace(UserBase):
    password: str
    roles: List[str] = Field(default_factory=list)


class UserPatch(BaseModel):
    username: Optional[str] = None
    password: Optional[str] = None
    roles: Optional[List[str]] = None


class Token(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"


class AccessTokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"


class TokenData(BaseModel):
    user_id: int
    roles: List[str] = Field(default_factory=list)
    permissions: List[str] = Field(default_factory=list)
    token_version: int = 0


class LoginRequest(BaseModel):
    username: str
    password: str


class TokenRefreshRequest(BaseModel):
    refresh_token: str


class PermissionResponse(BaseModel):
    name: str


class RoleBase(BaseModel):
    name: str


class RoleCreate(RoleBase):
    permissions: Optional[List[str]] = []  # List of permission names


class RoleUpdate(RoleBase):
    permissions: Optional[List[str]] = []


class RoleResponse(RoleBase):
    model_config = ConfigDict(from_attributes=True)
    id_url: str
    permissions: List[str] = []
