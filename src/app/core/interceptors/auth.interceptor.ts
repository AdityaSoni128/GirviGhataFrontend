import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, switchMap, throwError } from 'rxjs';
import { AuthService } from '../services/auth.service';

/**
 * Functional interceptor (Angular 15+ style). Attaches the access token to
 * every request; on a 401 it attempts exactly one silent refresh-and-retry
 * before giving up and forcing logout — never an infinite retry loop.
 */
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const auth = inject(AuthService);
  const token = auth.getAccessToken();

  const authedReq = token
    ? req.clone({ setHeaders: { Authorization: `Bearer ${token}` } })
    : req;

  return next(authedReq).pipe(
    catchError((error: HttpErrorResponse) => {
      const isAuthEndpoint = req.url.includes('/auth/login') || req.url.includes('/auth/refresh');
      if (error.status === 401 && !isAuthEndpoint && auth.getRefreshToken()) {
        return auth.refresh().pipe(
          switchMap((tokens) => {
            const retried = req.clone({ setHeaders: { Authorization: `Bearer ${tokens.accessToken}` } });
            return next(retried);
          }),
          catchError((refreshError) => {
            auth.logout();
            return throwError(() => refreshError);
          }),
        );
      }
      return throwError(() => error);
    }),
  );
};
