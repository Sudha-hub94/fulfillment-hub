from datetime import datetime, timedelta
from typing import Optional, Union
import bcrypt
from jose import JWTError, jwt
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from app.core.config import settings
from app.db.session import SessionLocal
from app import models, schemas
from sqlalchemy.orm import Session

# Password hashing.
#
# `passlib` 1.7.2 is not compatible with bcrypt >= 4.1: it reads the removed
# `bcrypt.__about__` attribute and then fails with
# `TypeError: NotImplemented should not be used in a boolean context`.
# The helpers below therefore call bcrypt directly. They still produce the
# standard `$2b$` hash format, so hashes created by passlib keep working.
BCRYPT_MAX_BYTES = 72
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token")

def _encode_password(password: str) -> bytes:
    """Encode a password for bcrypt, honouring its 72 byte input limit."""
    return password.encode("utf-8")[:BCRYPT_MAX_BYTES]

def verify_password(plain_password, hashed_password):
    try:
        return bcrypt.checkpw(
            _encode_password(plain_password), hashed_password.encode("utf-8")
        )
    except (TypeError, ValueError):
        # Malformed or unknown hash: fail the login instead of raising a 500.
        return False

def get_password_hash(password):
    return bcrypt.hashpw(_encode_password(password), bcrypt.gensalt()).decode("utf-8")

def authenticate_user(db: Session, username: str, password: str):
    user = get_user_by_username(db, username)
    if not user:
        return False
    if not verify_password(password, user.hashed_password):
        return False
    return user

def get_user_by_username(db: Session, username: str):
    return db.query(models.User).filter(models.User.username == username).first()

def create_access_token(subject: str, expires_delta: Optional[timedelta] = None):
    """Create a signed JWT whose ``sub`` claim holds the username."""
    to_encode = {"sub": subject}
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=15)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)
    return encoded_jwt

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

async def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        username: str = payload.get("sub")
        if username is None:
            raise credentials_exception
        token_data = schemas.TokenData(username=username)
    except JWTError:
        raise credentials_exception
    user = get_user_by_username(db, username=token_data.username)
    if user is None:
        raise credentials_exception
    return user

async def get_current_active_user(current_user: models.User = Depends(get_current_user)):
    if not current_user.is_active:
        raise HTTPException(status_code=400, detail="Inactive user")
    return current_user