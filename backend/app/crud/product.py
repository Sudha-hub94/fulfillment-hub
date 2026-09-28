from sqlalchemy.orm import Session
from app import models, schemas

def get_product(db: Session, product_id: int):
    return db.query(models.Product).filter(models.Product.id == product_id).first()

def get_product_by_sku(db: Session, sku: str):
    return db.query(models.Product).filter(models.Product.sku == sku).first()

def get_products(db: Session, skip: int = 0, limit: int = 100):
    return db.query(models.Product).offset(skip).limit(limit).all()

def create_product(db: Session, product: schemas.ProductCreate):
    db_product = models.Product(
        sku=product.sku,
        name=product.name,
        description=product.description,
        category=product.category,
        price=product.price,
        weight=product.weight,
        dimensions=product.dimensions,
        is_active=product.is_active
    )
    db.add(db_product)
    db.commit()
    db.refresh(db_product)
    return db_product

def update_product(db: Session, db_obj: models.Product, obj_in: schemas.ProductUpdate):
    update_data = obj_in.dict(exclude_unset=True)
    for field, value in update_data.items():
        setattr(db_obj, field, value)
    db.add(db_obj)
    db.commit()
    db.refresh(db_obj)
    return db_obj

def remove_product(db: Session, product_id: int):
    obj = db.query(models.Product).get(product_id)
    if obj is None:
        return None
    # Serialize while still session-bound: after commit() the instance is
    # detached and lazy relationships can no longer be loaded.
    snapshot = schemas.Product.model_validate(obj)
    db.delete(obj)
    db.commit()
    return snapshot

# ---------------------------------------------------------------------------
# Generic CRUD names used by the API layer (`app.api.v1.endpoints.products`).
# ---------------------------------------------------------------------------

def get(db: Session, id: int):
    return get_product(db, product_id=id)

def get_by_sku(db: Session, sku: str):
    return get_product_by_sku(db, sku=sku)

def get_multi(db: Session, skip: int = 0, limit: int = 100):
    return get_products(db, skip=skip, limit=limit)

def create(db: Session, obj_in: schemas.ProductCreate):
    return create_product(db, product=obj_in)

def update(db: Session, db_obj: models.Product, obj_in: schemas.ProductUpdate):
    return update_product(db, db_obj=db_obj, obj_in=obj_in)

def remove(db: Session, id: int):
    return remove_product(db, product_id=id)
