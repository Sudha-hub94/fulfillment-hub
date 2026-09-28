from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime
from app.schemas.product import ProductBase
from app.schemas.user import User

class OrderItemBase(BaseModel):
    quantity: int = Field(..., gt=0)
    price_per_unit: float = Field(..., gt=0)

class OrderItemCreate(OrderItemBase):
    product_id: int

class OrderItem(OrderItemBase):
    id: int
    # Mirrors the nullable `order_items.product_id` FK (nulled when the product
    # is deleted). Exposed so clients can match lines against inventory stock.
    product_id: Optional[int] = None
    # Nullable: the referenced product may have been deleted (the FK is nulled).
    product: Optional[ProductBase] = None

    model_config = {"from_attributes": True}

class OrderBase(BaseModel):
    order_number: str = Field(..., min_length=1)
    customer_name: str = Field(..., min_length=1)
    customer_email: Optional[str] = None
    customer_address: Optional[str] = None
    status: str = Field(default="pending")
    priority: bool = False
    total_amount: Optional[float] = None

    # Used as a nested response field (`Shipment.order`).
    model_config = {"from_attributes": True}

class OrderCreate(OrderBase):
    items: List[OrderItemCreate]

class OrderUpdate(BaseModel):
    order_number: Optional[str] = None
    customer_name: Optional[str] = None
    customer_email: Optional[str] = None
    customer_address: Optional[str] = None
    status: Optional[str] = None
    priority: Optional[bool] = None
    total_amount: Optional[float] = None

class OrderInDBBase(OrderBase):
    id: int
    created_at: datetime
    updated_at: datetime
    shipped_at: Optional[datetime] = None
    delivered_at: Optional[datetime] = None
    # Nullable FKs: nulled when the referenced row is deleted.
    owner_id: Optional[int] = None

    model_config = {"from_attributes": True}

class OrderInDB(OrderInDBBase):
    pass

class Order(OrderInDBBase):
    items: List[OrderItem] = []
    owner: Optional[User] = None

    model_config = {"from_attributes": True}
