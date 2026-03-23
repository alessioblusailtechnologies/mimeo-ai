import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { AuthService } from '../services/auth.service';
import { catchError, switchMap, throwError } from 'rxjs';

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
      if (error.status !== 401 || req.url.includes('/auth/login') || req.url.includes('/auth/register') || req.url.includes('/auth/refresh')) {
        return throwError(() => error);
      }

      if (authService.isRefreshing) {
        return authService.refreshSubject$.pipe(
          switchMap(newToken => next(req.clone({
            setHeaders: { Authorization: `Bearer ${newToken}` },
          })))
        );
      }

      return authService.refreshToken().pipe(
        switchMap(newToken => next(req.clone({
          setHeaders: { Authorization: `Bearer ${newToken}` },
        })))
      );
    })
  );
};
