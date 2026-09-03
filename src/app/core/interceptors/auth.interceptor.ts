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
        /**
         * ROOT CAUSE OF THE LOGOUT BUG:
         *
         * This catchError used to sit AFTER switchMap, which meant it
         * caught errors from BOTH auth.refresh() AND the retried
         * next(retriedRequest) call below — RxJS's catchError() catches
         * everything upstream of it in the pipe, including errors
         * raised inside an operator like switchMap that it follows.
         *
         * So: refresh() would succeed, new tokens would be stored,
         * isAuthenticated would flip back to true — and then if the
         * RETRIED request failed for any unrelated reason (a 403 from
         * a permissions check, a transient network error, Render's
         * free-tier backend still cold-starting from the 15 minutes of
         * idle time that just elapsed, even a 500), that error was
         * treated exactly like a refresh failure and auth.logout() ran
         * regardless. The backend refresh endpoint was working
         * correctly; the frontend was logging the user out because of
         * unrelated errors on the FOLLOW-UP request, not because the
         * session was actually invalid.
         *
         * Fix: catchError here only wraps auth.refresh() itself, so it
         * only fires on a genuine refresh failure (expired/revoked/
         * invalid refresh token).
         */
        catchError((refreshError) => {
          auth.logout();
          return throwError(() => refreshError);
        }),

        switchMap((tokens) => {
          const retriedRequest = req.clone({
            context: req.context.set(AUTH_RETRIED, true),
            setHeaders: {
              Authorization: `Bearer ${tokens.accessToken}`,
            },
          });

          return next(retriedRequest).pipe(
            catchError((retryError: HttpErrorResponse) => {
              /**
               * The retried request failed on its own merits. This is
               * NOT a refresh failure — the new access token is valid,
               * so do not force a logout for a permissions error, a
               * validation error, or a transient network/server issue.
               *
               * The only case that still means "the session really is
               * unusable" is a SECOND 401 on the brand-new token —
               * e.g. the account was deactivated or tokenVersion was
               * bumped (logout-all) in the split second after refresh
               * issued this token.
               */
              if (retryError.status === 401) {
                auth.logout();
              }

              return throwError(() => retryError);
            }),
          );
        }),
      );
    }),
  );
};
