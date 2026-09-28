import { inject } from '@angular/core';
import { HttpInterceptorFn } from '@angular/common/http';

import { API_BASE_URL } from '../services/api.config';
import { AuthService } from './auth.service';

/**
 * Attaches the bearer token to every backend call, so the FastAPI
 * `get_current_active_user` dependency can authenticate the request.
 */
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const token = inject(AuthService).getToken();

  if (token && req.url.startsWith(API_BASE_URL)) {
    return next(req.clone({ setHeaders: { Authorization: `Bearer ${token}` } }));
  }

  return next(req);
};
