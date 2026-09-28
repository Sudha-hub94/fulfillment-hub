# Fulfillment Hub Application

This is a full-stack application for managing e-commerce order fulfillment, built with Angular frontend and Python backend.

## Features

- Order tracking and management
- Inventory management
- Priority order handling
- Stock movement tracking
- Shipment tracking
- User authentication and authorization
- Responsive user interface

## Architecture

- Frontend: Angular with Angular Material
- Backend: Python (FastAPI) with SQLAlchemy ORM
- Database: PostgreSQL (or SQLite for development)
- Authentication: JWT-based

## Getting Started

### Prerequisites

- Node.js (v14 or later)
- Python (v3.8 or later)
- PostgreSQL (optional, for development SQLite can be used)

### Backend Setup

1. Navigate to the backend directory:
   ```
   cd fulfillment-hub/backend
   ```
2. Create a virtual environment:
   ```
   python -m venv venv
   ```
3. Activate the virtual environment:
   - Windows: `venv\Scripts\activate`
   - Unix/Linux: `source venv/bin/activate`
4. Install dependencies:
   ```
   pip install -r requirements.txt
   ```
5. Set up the database:
   - For development, the application will use SQLite by default.
   - For PostgreSQL, update the database URL in `.env` and run migrations.
6. Run the backend server on **port 8000** (the Angular app expects the API at
   `http://localhost:8000/api/v1`, see `frontend/src/app/services/api.config.ts`):
   ```
   venv\Scripts\python.exe -m uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
   ```
   The server creates any missing tables at startup, so `init_db.py` (below) is
   only needed to seed/replace the admin account.

### First-time login

There is **no** pre-seeded account in the repository, so create the schema and
the first administrator once (from the `backend` directory):

```
venv\Scripts\python.exe init_db.py
```

The script creates the SQLite file (`backend/fulfillment_hub.db`), creates any
missing tables and inserts:

- username: `admin`
- password: `admin123`

(`UserCreate` requires at least 8 characters, hence `admin123`.)

Use your own credentials with:

```
venv\Scripts\python.exe init_db.py --username ops --password "your-password" --email ops@example.com
venv\Scripts\python.exe init_db.py --reset-password --password "new-password"
```

The frontend logs in at <http://localhost:4200/auth/login>, which calls
`POST /api/v1/users/login` (OAuth2 password form: `username` + `password`).

### Frontend Setup

1. Navigate to the frontend directory:
   ```
   cd fulfillment-hub/frontend
   ```
2. Install dependencies:
   ```
   npm install
   ```
3. Start the development server:
   ```
   ng serve
   ```

## Deployment

See [DEPLOYMENT.md](DEPLOYMENT.md) for deployment instructions using Docker.

## License

MIT