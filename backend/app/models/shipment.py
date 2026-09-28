from sqlalchemy import Boolean, Column, ForeignKey, Integer, String, DateTime, Float, Text
from sqlalchemy.orm import relationship
from app.db.base import Base
from datetime import datetime

class Shipment(Base):
    __tablename__ = "shipments"

    id = Column(Integer, primary_key=True, index=True)
    tracking_number = Column(String, unique=True, index=True, nullable=False)
    carrier = Column(String)  # e.g., FedEx, UPS, USPS
    service_level = Column(String)  # e.g., Ground, Express, Overnight
    status = Column(String, default="pending")  # pending, picked_up, in_transit, delivered, exception
    shipping_cost = Column(Float)
    estimated_delivery = Column(DateTime)
    actual_delivery = Column(DateTime, nullable=True)
    notes = Column(Text)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Foreign keys
    order_id = Column(Integer, ForeignKey("orders.id"))
    created_by_id = Column(Integer, ForeignKey("users.id"))
    
    # Relationships
    order = relationship("Order", back_populates="shipments")
    created_by = relationship("User", back_populates="shipments")