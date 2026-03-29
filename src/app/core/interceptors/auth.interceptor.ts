import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { AuthService } from '../services/auth.service';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  if (!req.url.includes('/api')) {
    return next(req);
  }

  const token = inject(AuthService).getToken();

  // Always set withCredentials so the browser sends the httpOnly refresh-token
  // cookie on /api/auth/refresh and /api/auth/logout requests.
  const authReq = token
    ? req.clone({ withCredentials: true, setHeaders: { Authorization: `Bearer ${token}` } })
    : req.clone({ withCredentials: true });

  return next(authReq);
};