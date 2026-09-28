from sqlalchemy.orm import Session
from app import models, schemas
from typing import List

def get_shipment(db: Session, shipment_id: int):
    return db.query(models.Shipment).filter(models.Shipment.id == shipment_id).first()

def get_shipments(db: Session, skip: int = 0, limit: int = 100):
    return db.query(models.Shipment).offset(skip).limit(limit).all()

def get_shipments_by_order(db: Session, order_id: int, skip: int = 0, limit: int = 100):
    return db.query(models.Shipment).filter(models.Shipment.order_id == order_id).offset(skip).limit(limit).all()

def get_shipments_by_user(db: Session, user_id: int, skip: int = 0, limit: int = 100):
    return db.query(models.Shipment).filter(models.Shipment.created_by_id == user_id).offset(skip).limit(limit).all()

def create_shipment(db: Session, shipment: schemas.ShipmentCreate, created_by_id: int):
    db_shipment = models.Shipment(
        tracking_number=shipment.tracking_number,
        carrier=shipment.carrier,
        service_level=shipment.service_level,
        status=shipment.status,
        shipping_cost=shipment.shipping_cost,
        estimated_delivery=shipment.estimated_delivery,
        actual_delivery=shipment.actual_delivery,
        notes=shipment.notes,
        order_id=shipment.order_id,
        created_by_id=created_by_id
    )
    db.add(db_shipment)
    db.commit()
    db.refresh(db_shipment)
    return db_shipment

def update_shipment(db: Session, db_obj: models.Shipment, obj_in: schemas.ShipmentUpdate):
    update_data = obj_in.dict(exclude_unset=True)
    for field, value in update_data.items():
        setattr(db_obj, field, value)
    db.add(db_obj)
    db.commit()
    db.refresh(db_obj)
    return db_obj

def remove_shipment(db: Session, shipment_id: int):
    obj = db.query(models.Shipment).get(shipment_id)
    if obj is None:
        return None
    # Serialize while still session-bound: after commit() the instance is
    # detached and lazy relationships (e.g. `order`) can no longer be loaded.
    snapshot = schemas.Shipment.model_validate(obj)
    db.delete(obj)
    db.commit()
    return snapshot

# ---------------------------------------------------------------------------
# Generic CRUD names used by the API layer (`app.api.v1.endpoints.shipments`).
# ---------------------------------------------------------------------------

def get(db: Session, id: int):
    return get_shipment(db, shipment_id=id)

def get_multi(db: Session, skip: int = 0, limit: int = 100):
    return get_shipments(db, skip=skip, limit=limit)

def create_with_owner(db: Session, obj_in: schemas.ShipmentCreate, created_by_id: int):
    return create_shipment(db, shipment=obj_in, created_by_id=created_by_id)

def update(db: Session, db_obj: models.Shipment, obj_in: schemas.ShipmentUpdate):
    return update_shipment(db, db_obj=db_obj, obj_in=obj_in)

def remove(db: Session, id: int):
    return remove_shipment(db, shipment_id=id)
