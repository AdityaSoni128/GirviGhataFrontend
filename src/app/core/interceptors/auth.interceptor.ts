import {
  HttpContextToken,
  HttpErrorResponse,
  HttpInterceptorFn,
} from '@angular/common/http';

import { inject } from '@angular/core';

import {
  catchError,
  switchMap,
  throwError,
} from 'rxjs';

import { AuthService } from '../services/auth.service';

/**
 * Marks a request that has already been retried after token refresh.
 *
 * This prevents:
 *
 * 401
 *   -> refresh
 *   -> retry
 *   -> 401
 *   -> refresh
 *   -> retry
 *   -> ...
 *
 * The request gets only one refresh/retry opportunity.
 */
const AUTH_RETRIED = new HttpContextToken<boolean>(() => false);

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const auth = inject(AuthService);

  const isLoginEndpoint = req.url.includes('/auth/login');
  const isRefreshEndpoint = req.url.includes('/auth/refresh');

  const isAuthEndpoint = isLoginEndpoint || isRefreshEndpoint;

  const hasAlreadyRetried = req.context.get(AUTH_RETRIED);

  const accessToken = auth.getAccessToken();

  const authenticatedRequest = accessToken
    ? req.clone({
        setHeaders: {
          Authorization: `Bearer ${accessToken}`,
        },
      })
    : req;

  return next(authenticatedRequest).pipe(
    catchError((error: HttpErrorResponse) => {
      /**
       * Login and refresh requests must never trigger another refresh.
       */
      if (isAuthEndpoint) {
        return throwError(() => error);
      }

      /**
       * A retried request must not start another refresh cycle.
       */
      if (hasAlreadyRetried) {
        if (error.status === 401) {
          auth.logout();
        }

        return throwError(() => error);
      }

      /**
       * Only 401 responses can trigger token refresh.
       *
       * If there is no refresh token, there is no session to recover.
       */
      if (error.status !== 401 || !auth.getRefreshToken()) {
        return throwError(() => error);
      }

      /**
       * AuthService.refresh() is single-flight.
       *
       * If A/B/C all reach this point simultaneously:
       *
       * A -> refresh()
       * B -> same refresh observable
       * C -> same refresh observable
       *
       * Only ONE HTTP refresh request is sent.
       */
      return auth.refresh().pipe(
        switchMap((tokens) => {
          const retriedRequest = req.clone({
            context: req.context.set(AUTH_RETRIED, true),
            setHeaders: {
              Authorization: `Bearer ${tokens.accessToken}`,
            },
          });

          return next(retriedRequest);
        }),

        catchError((refreshError) => {
          /**
           * Refresh failure means the refresh token is invalid,
           * expired, revoked, or otherwise unusable.
           *
           * Clear the client session and redirect to login.
           */
          auth.logout();

          return throwError(() => refreshError);
        }),
      );
    }),
  );
};
