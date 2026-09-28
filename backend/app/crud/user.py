from sqlalchemy.orm import Session
from app import models, schemas
from app.core.security import get_password_hash

def get_user(db: Session, user_id: int):
    return db.query(models.User).filter(models.User.id == user_id).first()

def get_user_by_email(db: Session, email: str):
    return db.query(models.User).filter(models.User.email == email).first()

def get_user_by_username(db: Session, username: str):
    return db.query(models.User).filter(models.User.username == username).first()

def get_users(db: Session, skip: int = 0, limit: int = 100):
    return db.query(models.User).offset(skip).limit(limit).all()

def create_user(db: Session, user: schemas.UserCreate):
    hashed_password = get_password_hash(user.password)
    db_user = models.User(
        email=user.email,
        username=user.username,
        hashed_password=hashed_password,
        full_name=user.full_name,
        is_active=user.is_active,
        role=user.role
    )
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user

def update_user(db: Session, db_obj: models.User, obj_in: schemas.UserUpdate):
    update_data = obj_in.dict(exclude_unset=True)
    if "password" in update_data:
        update_data["hashed_password"] = get_password_hash(update_data.pop("password"))
    for field, value in update_data.items():
        setattr(db_obj, field, value)
    db.add(db_obj)
    db.commit()
    db.refresh(db_obj)
    return db_obj

def remove_user(db: Session, user_id: int):
    obj = db.query(models.User).get(user_id)
    if obj is None:
        return None
    # Serialize while still session-bound: after commit() the instance is
    # detached and lazy relationships can no longer be loaded.
    snapshot = schemas.User.model_validate(obj)
    db.delete(obj)
    db.commit()
    return snapshot

# ---------------------------------------------------------------------------
# Generic CRUD names used by the API layer (`app.api.v1.endpoints.users`).
# They are thin wrappers around the functions above so that the endpoint code
# can use the usual ``get`` / ``get_multi`` / ``create`` / ``update`` / ``remove``
# naming.
# ---------------------------------------------------------------------------

def get(db: Session, id: int):
    return get_user(db, user_id=id)

def get_by_email(db: Session, email: str):
    return get_user_by_email(db, email=email)

def get_by_username(db: Session, username: str):
    return get_user_by_username(db, username=username)

def get_multi(db: Session, skip: int = 0, limit: int = 100):
    return get_users(db, skip=skip, limit=limit)

def create(db: Session, obj_in: schemas.UserCreate):
    return create_user(db, user=obj_in)

def update(db: Session, db_obj: models.User, obj_in: schemas.UserUpdate):
    return update_user(db, db_obj=db_obj, obj_in=obj_in)

def remove(db: Session, id: int):
    return remove_user(db, user_id=id)
