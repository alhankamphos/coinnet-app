from pydantic import BaseModel, EmailStr, Field
from typing import Optional, Literal
from datetime import datetime


class UserCreate(BaseModel):
    email: EmailStr
    password: str = Field(min_length=6)
    full_name: str = Field(min_length=2)
    phone: Optional[str] = None
    account_type: Literal["user", "provider_business"] = "user"


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class UserOut(BaseModel):
    id: str
    email: str
    full_name: str
    phone: Optional[str]
    account_type: str
    status: str
    reputation_score: float
    created_at: datetime


class UserInDB(BaseModel):
    email: str
    full_name: str
    phone: Optional[str] = None
    account_type: str = "user"
    status: str = "active"
    password_hash: str
    reputation_score: float = 5.0
    total_transactions: int = 0
    disputed_transactions: int = 0
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
