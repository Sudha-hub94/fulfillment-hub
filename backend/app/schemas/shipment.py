from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime
from app.schemas.order import OrderBase
from app.schemas.user import User

class ShipmentBase(BaseModel):
    tracking_number: str = Field(..., min_length=1)
    carrier: Optional[str] = None
    service_level: Optional[str] = None
    status: str = Field(default="pending")
    shipping_cost: Optional[float] = Field(None, ge=0)
    estimated_delivery: Optional[datetime] = None
    actual_delivery: Optional[datetime] = None
    notes: Optional[str] = None

class ShipmentCreate(ShipmentBase):
    order_id: int

class ShipmentUpdate(BaseModel):
    tracking_number: Optional[str] = None
    carrier: Optional[str] = None
    service_level: Optional[str] = None
    status: Optional[str] = None
    shipping_cost: Optional[float] = Field(None, ge=0)
    estimated_delivery: Optional[datetime] = None
    actual_delivery: Optional[datetime] = None
    notes: Optional[str] = None

class ShipmentInDBBase(ShipmentBase):
    id: int
    # Nullable FKs: nulled when the referenced order/user is deleted.
    order_id: Optional[int] = None
    created_by_id: Optional[int] = None
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}

class ShipmentInDB(ShipmentInDBBase):
    pass

class Shipment(ShipmentInDBBase):
    order: Optional[OrderBase] = None
    created_by: Optional[User] = None

    model_config = {"from_attributes": True}
