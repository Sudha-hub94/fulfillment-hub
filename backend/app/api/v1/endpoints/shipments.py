from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from app import crud, models, schemas
from app.db.session import get_db
from app.core.security import get_current_active_user

router = APIRouter()

@router.post("/", response_model=schemas.Shipment)
def create_shipment(
    shipment_in: schemas.ShipmentCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user),
):
    """
    Create new shipment.
    """
    # Check if order exists
    order = crud.order.get(db, id=shipment_in.order_id)
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    
    shipment = crud.shipment.create_with_owner(db, obj_in=shipment_in, created_by_id=current_user.id)
    return shipment

@router.get("/", response_model=List[schemas.Shipment])
def read_shipments(
    db: Session = Depends(get_db),
    skip: int = 0,
    limit: int = 100,
    current_user: models.User = Depends(get_current_active_user),
):
    """
    Retrieve shipments.
    """
    shipments = crud.shipment.get_multi(db, skip=skip, limit=limit)
    return shipments

@router.get("/{shipment_id}", response_model=schemas.Shipment)
def read_shipment(
    shipment_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user),
):
    """
    Get shipment by ID.
    """
    shipment = crud.shipment.get(db, id=shipment_id)
    if not shipment:
        raise HTTPException(status_code=404, detail="Shipment not found")
    return shipment

@router.put("/{shipment_id}", response_model=schemas.Shipment)
def update_shipment(
    shipment_id: int,
    shipment_in: schemas.ShipmentUpdate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user),
):
    """
    Update a shipment.
    """
    shipment = crud.shipment.get(db, id=shipment_id)
    if not shipment:
        raise HTTPException(status_code=404, detail="Shipment not found")
    shipment = crud.shipment.update(db, db_obj=shipment, obj_in=shipment_in)
    return shipment

@router.delete("/{shipment_id}", response_model=schemas.Shipment)
def delete_shipment(
    shipment_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user),
):
    """
    Delete a shipment.
    """
    shipment = crud.shipment.get(db, id=shipment_id)
    if not shipment:
        raise HTTPException(status_code=404, detail="Shipment not found")
    shipment = crud.shipment.remove(db, id=shipment_id)
    return shipment