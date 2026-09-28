from sqlalchemy.orm import Session
from app import models, schemas

def get_inventory_item(db: Session, inventory_id: int):
    return db.query(models.Inventory).filter(models.Inventory.id == inventory_id).first()

def get_inventory_items(db: Session, skip: int = 0, limit: int = 100):
    return db.query(models.Inventory).offset(skip).limit(limit).all()

def get_inventory_by_product(db: Session, product_id: int):
    return db.query(models.Inventory).filter(models.Inventory.product_id == product_id).first()

def create_inventory_item(db: Session, inventory: schemas.InventoryCreate):
    # `InventoryCreate` carries no SKU: the record belongs to a product, so the
    # product SKU is reused for the non-nullable, unique `sku` column.
    product = db.query(models.Product).filter(models.Product.id == inventory.product_id).first()
    db_inventory = models.Inventory(
        sku=product.sku if product else None,
        quantity=inventory.quantity,
        location=inventory.location,
        reorder_level=inventory.reorder_level,
        last_restocked=inventory.last_restocked,
        product_id=inventory.product_id
    )
    db.add(db_inventory)
    db.commit()
    db.refresh(db_inventory)
    return db_inventory

def update_inventory_item(db: Session, db_obj: models.Inventory, obj_in: schemas.InventoryUpdate):
    update_data = obj_in.dict(exclude_unset=True)
    for field, value in update_data.items():
        setattr(db_obj, field, value)
    db.add(db_obj)
    db.commit()
    db.refresh(db_obj)
    return db_obj

def remove_inventory_item(db: Session, inventory_id: int):
    obj = db.query(models.Inventory).get(inventory_id)
    if obj is None:
        return None
    # Serialize while still session-bound: after commit() the instance is
    # detached and lazy relationships (e.g. `product`) can no longer be loaded.
    snapshot = schemas.Inventory.model_validate(obj)
    db.delete(obj)
    db.commit()
    return snapshot

# ---------------------------------------------------------------------------
# Generic CRUD names used by the API layer (`app.api.v1.endpoints.inventory`).
# ---------------------------------------------------------------------------

def get(db: Session, id: int):
    return get_inventory_item(db, inventory_id=id)

def get_multi(db: Session, skip: int = 0, limit: int = 100):
    return get_inventory_items(db, skip=skip, limit=limit)

def get_by_product(db: Session, product_id: int):
    return get_inventory_by_product(db, product_id=product_id)

def create(db: Session, obj_in: schemas.InventoryCreate):
    return create_inventory_item(db, inventory=obj_in)

def update(db: Session, db_obj: models.Inventory, obj_in: schemas.InventoryUpdate):
    return update_inventory_item(db, db_obj=db_obj, obj_in=obj_in)

def remove(db: Session, id: int):
    return remove_inventory_item(db, inventory_id=id)
