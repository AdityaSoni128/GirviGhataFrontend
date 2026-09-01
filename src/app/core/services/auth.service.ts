import { Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import {
  catchError,
  finalize,
  map,
  Observable,
  of,
  shareReplay,
  tap,
  throwError,
} from 'rxjs';

import { environment } from '../../../environments/environment';
import { AuthTokens } from '../models/api-models';

interface DecodedAccessToken {
  sub: string;
  tenantId: string;
  branchIds: string[];
  permissions: string[];
  exp: number;
}

const ACCESS_TOKEN_KEY = 'girvi_access_token';
const REFRESH_TOKEN_KEY = 'girvi_refresh_token';

@Injectable({ providedIn: 'root' })
export class AuthService {
  readonly isAuthenticated = signal<boolean>(this.hasValidToken());
  readonly permissions = signal<string[]>(this.currentPermissions());

  /**
   * Shared refresh operation.
   *
   * At most one POST /auth/refresh request can be in flight at a time.
   */
  private refreshInFlight$: Observable<AuthTokens> | null = null;

  constructor(
    private readonly http: HttpClient,
    private readonly router: Router,
  ) {}

  login(email: string, password: string): Observable<AuthTokens> {
    return this.http
      .post<AuthTokens>(
        `${environment.apiBaseUrl}/auth/login`,
        { email, password },
      )
      .pipe(
        tap((tokens) => this.storeTokens(tokens)),
      );
  }

  refresh(): Observable<AuthTokens> {
    if (this.refreshInFlight$) {
      return this.refreshInFlight$;
    }

    const refreshToken = this.getRefreshToken();

    if (!refreshToken) {
      return throwError(() => new Error('No refresh token available'));
    }

    const request$ = this.http
      .post<AuthTokens>(
        `${environment.apiBaseUrl}/auth/refresh`,
        { refreshToken },
      )
      .pipe(
        tap((tokens) => this.storeTokens(tokens)),
        finalize(() => {
          this.refreshInFlight$ = null;
        }),
      );

    this.refreshInFlight$ = request$.pipe(
      shareReplay({
        bufferSize: 1,
        refCount: false,
      }),
    );

    return this.refreshInFlight$;
  }

  /**
   * Runs once during application startup.
   *
   * Valid access token:
   *   restore state and continue.
   *
   * Expired access token + valid refresh token:
   *   silently refresh and continue.
   *
   * Invalid/expired refresh token:
   *   clear auth state and continue as unauthenticated.
   */
 initializeAuth(): Observable<boolean> {
  const accessToken = this.getAccessToken();
  const refreshToken = this.getRefreshToken();

  // No existing session
  if (!accessToken && !refreshToken) {
    this.clearAuthState();
    return of(false);
  }

  // Access token is still valid
  if (accessToken && this.hasValidToken()) {
    this.restoreAuthState();
    return of(true);
  }

  // Access token is expired and refresh token doesn't exist
  if (!refreshToken) {
    this.clearAuthState();
    return of(false);
  }

  // Access token expired, try silent refresh
  return this.refresh().pipe(
    tap(() => {
      this.restoreAuthState();
    }),

    // AuthTokens -> boolean
    map(() => true),

    // Invalid/expired/revoked refresh token
    catchError(() => {
      this.clearAuthState();
      return of(false);
    }),
  );
}

  logout(): void {
    this.clearAuthState();
    this.router.navigate(['/login']);
  }

  getAccessToken(): string | null {
    return localStorage.getItem(ACCESS_TOKEN_KEY);
  }

  getRefreshToken(): string | null {
    return localStorage.getItem(REFRESH_TOKEN_KEY);
  }

  hasPermission(code: string): boolean {
    return this.permissions().includes(code);
  }

  private storeTokens(tokens: AuthTokens): void {
    localStorage.setItem(ACCESS_TOKEN_KEY, tokens.accessToken);
    localStorage.setItem(REFRESH_TOKEN_KEY, tokens.refreshToken);

    this.isAuthenticated.set(true);
    this.permissions.set(this.currentPermissions());
  }

  private restoreAuthState(): void {
    const token = this.getAccessToken();

    if (!token) {
      this.clearAuthState();
      return;
    }

    const decoded = this.decode(token);

    if (!decoded || decoded.exp * 1000 <= Date.now()) {
      this.clearAuthState();
      return;
    }

    this.isAuthenticated.set(true);
    this.permissions.set(decoded.permissions ?? []);
  }

  private clearAuthState(): void {
    localStorage.removeItem(ACCESS_TOKEN_KEY);
    localStorage.removeItem(REFRESH_TOKEN_KEY);

    this.isAuthenticated.set(false);
    this.permissions.set([]);
  }

  private hasValidToken(): boolean {
    const token = this.getAccessToken();

    if (!token) {
      return false;
    }

    const decoded = this.decode(token);

    return !!decoded && decoded.exp * 1000 > Date.now();
  }

  private currentPermissions(): string[] {
    const token = this.getAccessToken();
    const decoded = token ? this.decode(token) : null;

    return decoded?.permissions ?? [];
  }

  private decode(token: string): DecodedAccessToken | null {
    try {
      const payload = token.split('.')[1];

      if (!payload) {
        return null;
      }

      const normalized = payload
        .replace(/-/g, '+')
        .replace(/_/g, '/');

      return JSON.parse(atob(normalized));
    } catch {
      return null;
    }
  }
}
