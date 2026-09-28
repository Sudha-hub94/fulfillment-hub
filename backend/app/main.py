from contextlib import asynccontextmanager
from pathlib import Path

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from app import models  # noqa: F401  (registers the models on Base.metadata)
from app.api.v1.router import api_router
from app.core.config import settings
from app.db.base import Base
from app.db.session import engine


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Create any missing tables so a fresh clone is ready to use."""
    Base.metadata.create_all(bind=engine)
    yield


app = FastAPI(
    title=settings.PROJECT_NAME,
    openapi_url=f"{settings.API_V1_STR}/openapi.json",
    lifespan=lifespan
)

# Set up CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, replace with specific origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(api_router, prefix=settings.API_V1_STR)


# ---------------------------------------------------------------------------
# Static frontend (single-origin deployment: FastAPI also serves the Angular
# build). Render compiles the app during its build step, so the directory
# exists there; locally it appears after `npm run build` inside frontend/.
# API routes, /docs and /redoc are registered above, so they always win over
# this catch-all.
# ---------------------------------------------------------------------------
FRONTEND_DIST = (
    Path(__file__).resolve().parents[2] / "frontend" / "dist" / "frontend" / "browser"
)


@app.get("/{full_path:path}", include_in_schema=False)
async def serve_spa(full_path: str) -> FileResponse:
    """Serve hashed assets directly; everything else falls back to index.html."""
    if full_path.startswith("api/"):
        # Unknown API endpoints must stay JSON 404s instead of the SPA shell.
        raise HTTPException(status_code=404, detail="Not Found")

    candidate = (FRONTEND_DIST / full_path).resolve()
    if candidate.is_file() and candidate.is_relative_to(FRONTEND_DIST.resolve()):
        return FileResponse(candidate)

    index_file = FRONTEND_DIST / "index.html"
    if not index_file.is_file():
        raise HTTPException(
            status_code=404,
            detail=(
                "Frontend build not found. Run `npm run build` inside frontend/ "
                "(Render does this automatically in its build command)."
            ),
        )
    return FileResponse(index_file)