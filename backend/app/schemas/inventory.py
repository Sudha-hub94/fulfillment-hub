from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime
from app.schemas.product import ProductBase

class InventoryBase(BaseModel):
    quantity: int = Field(default=0, ge=0)
    location: Optional[str] = None
    reorder_level: int = Field(default=10, ge=0)
    last_restocked: Optional[datetime] = None

class InventoryCreate(InventoryBase):
    product_id: int

class InventoryUpdate(BaseModel):
    quantity: Optional[int] = Field(None, ge=0)
    location: Optional[str] = None
    reorder_level: Optional[int] = Field(None, ge=0)
    last_restocked: Optional[datetime] = None

class InventoryInDBBase(InventoryBase):
    id: int
    # Nullable FK: nulled when the referenced product is deleted.
    product_id: Optional[int] = None
    # Denormalised columns of the `inventory` table (also shown in the UI).
    sku: Optional[str] = None
    reserved_quantity: Optional[int] = None
    available_quantity: Optional[int] = None

    model_config = {"from_attributes": True}

class InventoryInDB(InventoryInDBBase):
    pass

class Inventory(InventoryInDBBase):
    product: Optional[ProductBase] = None

    model_config = {"from_attributes": True}
