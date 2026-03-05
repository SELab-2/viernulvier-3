from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel, ConfigDict


class UserBase(BaseModel):
    username: str


class UserResponse(UserBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    roles: List[str]
    permissions: List[str]
    created_at: datetime
    last_login_at: Optional[datetime] = None


class Token(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"


class AccessTokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"


class TokenData(BaseModel):
    username: Optional[str] = None
    roles: List[str] = []
    permissions: List[str] = []


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
    id: int
    permissions: List[str] = []
