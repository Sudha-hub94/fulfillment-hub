/**
 * Base URL of the FastAPI backend.
 *
 * - Local development (Angular dev server on :4200) talks to FastAPI on :8000.
 * - Any deployed environment (Render, etc.) uses the same origin, because
 *   FastAPI serves the compiled Angular build itself.
 *
 * Keep the path in sync with `settings.API_V1_STR` in backend/app/core/config.py.
 */
const isLocalDev =
  window.location.hostname === 'localhost' ||
  window.location.hostname === '127.0.0.1';

export const API_BASE_URL = isLocalDev
  ? 'http://localhost:8000/api/v1'
  : '/api/v1';
