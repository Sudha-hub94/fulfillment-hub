from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime

class ProductBase(BaseModel):
    sku: str = Field(..., min_length=1)
    name: str = Field(..., min_length=1)
    description: Optional[str] = None
    category: Optional[str] = None
    price: float = Field(..., gt=0)
    weight: Optional[float] = Field(None, gt=0)  # in kg
    dimensions: Optional[str] = None  # LxWxH in cm
    is_active: Optional[bool] = True

    # Also used as a nested response field (`Inventory.product`,
    # `OrderItem.product`), so ORM instances must be accepted directly.
    model_config = {"from_attributes": True}

class ProductCreate(ProductBase):
    pass

class ProductUpdate(BaseModel):
    sku: Optional[str] = None
    name: Optional[str] = None
    description: Optional[str] = None
    category: Optional[str] = None
    price: Optional[float] = Field(None, gt=0)
    weight: Optional[float] = Field(None, gt=0)
    dimensions: Optional[str] = None
    is_active: Optional[bool] = None

class ProductInDBBase(ProductBase):
    id: int
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}

class ProductInDB(ProductInDBBase):
    pass

class Product(ProductInDBBase):
    pass