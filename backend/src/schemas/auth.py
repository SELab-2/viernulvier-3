from datetime import datetime
from pydantic import BaseModel, ConfigDict
from typing import List, Optional


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
