from sqlalchemy import Boolean, Column, ForeignKey, Integer, String, DateTime, Float, Text
from sqlalchemy.orm import relationship
from app.db.base import Base
from datetime import datetime

class Inventory(Base):
    __tablename__ = "inventory"
    __table_args__ = {"extend_existing": True}

    id = Column(Integer, primary_key=True, index=True)
    sku = Column(String, unique=True, index=True, nullable=False)
    quantity = Column(Integer, default=0)
    location = Column(String)  # Warehouse location/bin
    reorder_level = Column(Integer, default=10)  # When to reorder
    reserved_quantity = Column(Integer, default=0)  # Quantity reserved for orders
    available_quantity = Column(Integer, default=0)  # Computed: quantity - reserved
    last_restocked = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    product_id = Column(Integer, ForeignKey("products.id"))
    product = relationship("Product", back_populates="inventory_items")