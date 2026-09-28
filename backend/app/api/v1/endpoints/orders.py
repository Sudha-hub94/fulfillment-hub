from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from app import crud, models, schemas
from app.db.session import get_db
from app.core.security import get_current_active_user

router = APIRouter()

@router.post("/", response_model=schemas.Order)
def create_order(
    order_in: schemas.OrderCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user),
):
    """
    Create new order.
    """
    order = crud.order.create_with_owner(db, obj_in=order_in, owner_id=current_user.id)
    return order

@router.get("/", response_model=List[schemas.Order])
def read_orders(
    db: Session = Depends(get_db),
    skip: int = 0,
    limit: int = 100,
    current_user: models.User = Depends(get_current_active_user),
):
    """
    Retrieve orders.
    """
    orders = crud.order.get_multi(db, skip=skip, limit=limit)
    return orders

@router.get("/{order_id}", response_model=schemas.Order)
def read_order(
    order_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user),
):
    """
    Get order by ID.
    """
    order = crud.order.get(db, id=order_id)
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    return order

@router.put("/{order_id}", response_model=schemas.Order)
def update_order(
    order_id: int,
    order_in: schemas.OrderUpdate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user),
):
    """
    Update an order.
    """
    order = crud.order.get(db, id=order_id)
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    order = crud.order.update(db, db_obj=order, obj_in=order_in)
    return order

@router.delete("/{order_id}", response_model=schemas.Order)
def delete_order(
    order_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user),
):
    """
    Delete an order.
    """
    order = crud.order.get(db, id=order_id)
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    order = crud.order.remove(db, id=order_id)
    return order