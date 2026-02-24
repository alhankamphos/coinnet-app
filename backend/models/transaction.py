from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime

COMMISSION_RATE = 0.05


class TransactionCreate(BaseModel):
    provider_id: str
    requested_amount: float = Field(gt=0)


class TransactionOut(BaseModel):
    id: str
    transaction_code: str
    user_id: str
    provider_id: str
    provider_name: Optional[str] = None
    sinpe_number: Optional[str] = None
    sinpe_holder_name: Optional[str] = None
    status: str
    requested_amount: float
    commission_amount: float
    total_to_send: float
    proof_url: Optional[str]
    created_at: datetime
    updated_at: datetime


class TransactionInDB(BaseModel):
    transaction_code: str
    user_id: str
    provider_id: str
    status: str = "requested"
    requested_amount: float
    commission_rate: float = COMMISSION_RATE
    commission_amount: float
    total_to_send: float
    proof_s3_url: Optional[str] = None
    proof_uploaded_at: Optional[datetime] = None
    sinpe_sent_at: Optional[datetime] = None
    verified_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None
    cancelled_at: Optional[datetime] = None
    timeline: List[dict] = []
    dispute: Optional[dict] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)


class DisputeCreate(BaseModel):
    reason: str = Field(min_length=10)


def calculate_commission(amount: float) -> dict:
    commission = round(amount * COMMISSION_RATE, 2)
    total = round(amount + commission, 2)
    return {
        "requested_amount": amount,
        "commission_rate": COMMISSION_RATE,
        "commission_amount": commission,
        "total_to_send": total,
    }
