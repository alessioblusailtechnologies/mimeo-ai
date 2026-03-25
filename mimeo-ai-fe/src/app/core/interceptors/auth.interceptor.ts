import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { AuthService } from '../services/auth.service';
import { catchError, switchMap, throwError } from 'rxjs';

const SKIP_REFRESH_URLS = ['/auth/login', '/auth/register', '/auth/refresh'];

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  const token = authService.getToken();

  if (token) {
    req = req.clone({
      setHeaders: { Authorization: `Bearer ${token}` },
    });
  }

  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      // Only intercept 401s, skip auth endpoints to avoid infinite loops
      if (error.status !== 401 || SKIP_REFRESH_URLS.some(url => req.url.includes(url))) {
        return throwError(() => error);
      }

      // All concurrent 401s share the same refresh call
      return authService.refreshToken().pipe(
        switchMap(newToken => next(req.clone({
          setHeaders: { Authorization: `Bearer ${newToken}` },
        }))),
        catchError(refreshError => throwError(() => refreshError))
      );
    })
  );
};
