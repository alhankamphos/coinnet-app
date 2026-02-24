from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime


class LocationModel(BaseModel):
    type: str = "Point"
    coordinates: List[float]  # [longitude, latitude]


class ProviderCreate(BaseModel):
    business_name: str = Field(min_length=2)
    sinpe_number: str = Field(min_length=8, max_length=12)
    sinpe_holder_name: str = Field(min_length=2)
    bank_email: str
    address: Optional[str] = None
    latitude: float
    longitude: float
    description: Optional[str] = None
    min_amount: float = 1000
    max_amount: float = 100000


class ProviderUpdate(BaseModel):
    business_name: Optional[str] = None
    sinpe_number: Optional[str] = None
    sinpe_holder_name: Optional[str] = None
    bank_email: Optional[str] = None
    address: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    description: Optional[str] = None
    min_amount: Optional[float] = None
    max_amount: Optional[float] = None
    declared_liquidity: Optional[float] = None


class ProviderAvailability(BaseModel):
    is_available: bool
    declared_liquidity: Optional[float] = None


class ProviderOut(BaseModel):
    id: str
    user_id: str
    business_name: str
    sinpe_number: str
    sinpe_holder_name: str
    address: Optional[str]
    latitude: float
    longitude: float
    description: Optional[str]
    verification_status: str
    is_available: bool
    declared_liquidity: Optional[float]
    min_amount: float
    max_amount: float
    reputation_score: float
    total_transactions: int
    distance_km: Optional[float] = None
    created_at: datetime


class ProviderInDB(BaseModel):
    user_id: str
    business_name: str
    sinpe_number: str
    sinpe_holder_name: str
    bank_email: str
    address: Optional[str] = None
    location: LocationModel
    description: Optional[str] = None
    verification_status: str = "pending_review"
    is_available: bool = False
    declared_liquidity: Optional[float] = None
    min_amount: float = 1000
    max_amount: float = 100000
    reputation_score: float = 5.0
    total_transactions: int = 0
    total_volume: float = 0.0
    dispute_rate: float = 0.0
    cover_photo: Optional[str] = None
    logo: Optional[str] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
