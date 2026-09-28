"""Create the database schema and seed the first administrator account.

The project ships without any user, so this script creates the tables (if they
are missing) and inserts a first account that can log in.

Run it from the `backend` directory:

    venv\\Scripts\\python.exe init_db.py
    venv\\Scripts\\python.exe init_db.py --username ops --password "S3curepass" --email ops@example.com
    venv\\Scripts\\python.exe init_db.py --reset-password --password "new-password"

Login afterwards with `POST /api/v1/users/login` (OAuth2 password form).
"""
from __future__ import annotations

import argparse

from app import models  # noqa: F401  (registers the models on Base.metadata)
from app.core.security import get_password_hash
from app.db.base import Base
from app.db.session import SessionLocal, engine

DEFAULT_USERNAME = "admin"
DEFAULT_PASSWORD = "admin123"
DEFAULT_EMAIL = "admin@example.com"
DEFAULT_FULL_NAME = "Fulfillment Hub Administrator"
DEFAULT_ROLE = "admin"


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--username", default=DEFAULT_USERNAME, help="login username")
    parser.add_argument("--email", default=DEFAULT_EMAIL, help="email address of the account")
    parser.add_argument("--password", default=DEFAULT_PASSWORD, help="plain text password (min. 8 characters)")
    parser.add_argument("--full-name", default=DEFAULT_FULL_NAME, help="display name of the account")
    parser.add_argument(
        "--role",
        default=DEFAULT_ROLE,
        choices=["admin", "office", "warehouse"],
        help="role stored on the account",
    )
    parser.add_argument(
        "--reset-password",
        action="store_true",
        help="update the password of an existing account instead of doing nothing",
    )
    return parser.parse_args()


def find_user(db, username: str, email: str):
    """Look up an account by username first, then by email."""
    user = db.query(models.User).filter(models.User.username == username).first()
    if user:
        return user
    return db.query(models.User).filter(models.User.email == email).first()


def main() -> None:
    args = parse_args()

    if len(args.password) < 8:
        raise SystemExit("The password must be at least 8 characters long.")

    Base.metadata.create_all(bind=engine)
    print(f"Schema ready on {engine.url} (tables: {', '.join(sorted(Base.metadata.tables))})")

    db = SessionLocal()
    try:
        user = find_user(db, args.username, args.email)

        if user and not args.reset_password:
            if user.email != args.email:
                # `schemas.UserBase.email` is an `EmailStr`, so keep the stored
                # address in sync with the (valid) value passed on the command line.
                user.email = args.email
                db.commit()
                print(f"Updated the email of '{user.username}' to {args.email}.")
            else:
                print(f"User '{user.username}' already exists - nothing to do.")
                print("Re-run with --reset-password --password <new password> to change the password.")
            login_username = user.username
        elif user:
            user.hashed_password = get_password_hash(args.password)
            user.full_name = args.full_name or user.full_name
            user.role = args.role
            db.commit()
            print(f"Password reset for '{user.username}' (id={user.id}).")
            login_username = user.username
        else:
            user = models.User(
                email=args.email,
                username=args.username,
                hashed_password=get_password_hash(args.password),
                full_name=args.full_name,
                is_active=True,
                is_superuser=args.role == "admin",
                role=args.role,
            )
            db.add(user)
            db.commit()
            db.refresh(user)
            print(f"Created user '{user.username}' (id={user.id}, role={user.role}).")
            login_username = user.username
    finally:
        db.close()

    print("\nLogin with:")
    print(f"  username : {login_username}")
    print(f"  password : {args.password}")
    print("  endpoint : POST /api/v1/users/login (OAuth2 password form)")


if __name__ == "__main__":
    main()
