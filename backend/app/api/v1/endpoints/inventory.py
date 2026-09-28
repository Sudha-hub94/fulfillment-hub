from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from app import crud, models, schemas
from app.db.session import get_db
from app.core.security import get_current_active_user

router = APIRouter()

@router.post("/", response_model=schemas.Inventory)
def create_inventory_item(
    inventory_in: schemas.InventoryCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user),
):
    """
    Create new inventory item.
    """
    # Check if product exists
    product = crud.product.get(db, id=inventory_in.product_id)
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    
    inventory = crud.inventory.create(db, obj_in=inventory_in)
    return inventory

@router.get("/", response_model=List[schemas.Inventory])
def read_inventory_items(
    db: Session = Depends(get_db),
    skip: int = 0,
    limit: int = 100,
    current_user: models.User = Depends(get_current_active_user),
):
    """
    Retrieve inventory items.
    """
    inventory_items = crud.inventory.get_multi(db, skip=skip, limit=limit)
    return inventory_items

@router.get("/{inventory_id}", response_model=schemas.Inventory)
def read_inventory_item(
    inventory_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user),
):
    """
    Get inventory item by ID.
    """
    inventory_item = crud.inventory.get(db, id=inventory_id)
    if not inventory_item:
        raise HTTPException(status_code=404, detail="Inventory item not found")
    return inventory_item

@router.put("/{inventory_id}", response_model=schemas.Inventory)
def update_inventory_item(
    inventory_id: int,
    inventory_in: schemas.InventoryUpdate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user),
):
    """
    Update an inventory item.
    """
    inventory_item = crud.inventory.get(db, id=inventory_id)
    if not inventory_item:
        raise HTTPException(status_code=404, detail="Inventory item not found")
    inventory_item = crud.inventory.update(db, db_obj=inventory_item, obj_in=inventory_in)
    return inventory_item

@router.delete("/{inventory_id}", response_model=schemas.Inventory)
def delete_inventory_item(
    inventory_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user),
):
    """
    Delete an inventory item.
    """
    inventory_item = crud.inventory.get(db, id=inventory_id)
    if not inventory_item:
        raise HTTPException(status_code=404, detail="Inventory item not found")
    inventory_item = crud.inventory.remove(db, id=inventory_id)
    return inventory_item