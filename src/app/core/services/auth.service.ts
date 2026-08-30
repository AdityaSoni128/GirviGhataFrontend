import { Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, tap } from 'rxjs';
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
  /** Reactive signal so components (e.g. the layout's nav) can react to login/logout. */
  readonly isAuthenticated = signal<boolean>(this.hasValidToken());
  readonly permissions = signal<string[]>(this.currentPermissions());

  constructor(
    private readonly http: HttpClient,
    private readonly router: Router,
  ) {}

  login(email: string, password: string): Observable<AuthTokens> {
    return this.http.post<AuthTokens>(`${environment.apiBaseUrl}/auth/login`, { email, password }).pipe(
      tap((tokens) => this.storeTokens(tokens)),
    );
  }

  refresh(): Observable<AuthTokens> {
    const refreshToken = localStorage.getItem(REFRESH_TOKEN_KEY);
    return this.http
      .post<AuthTokens>(`${environment.apiBaseUrl}/auth/refresh`, { refreshToken })
      .pipe(tap((tokens) => this.storeTokens(tokens)));
  }

  logout(): void {
    localStorage.removeItem(ACCESS_TOKEN_KEY);
    localStorage.removeItem(REFRESH_TOKEN_KEY);
    this.isAuthenticated.set(false);
    this.permissions.set([]);
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

  private hasValidToken(): boolean {
    const token = this.getAccessToken();
    if (!token) return false;
    const decoded = this.decode(token);
    return !!decoded && decoded.exp * 1000 > Date.now();
  }

  private currentPermissions(): string[] {
    const token = this.getAccessToken();
    const decoded = token ? this.decode(token) : null;
    return decoded?.permissions ?? [];
  }

  /** Minimal base64url JWT payload decode — no signature verification here,
   * that's the backend's job. This is purely for UI state (nav visibility,
   * expiry check) and must never be treated as a trust boundary. */
  private decode(token: string): DecodedAccessToken | null {
    try {
      const payload = token.split('.')[1];
      const normalized = payload.replace(/-/g, '+').replace(/_/g, '/');
      const json = atob(normalized);
      return JSON.parse(json);
    } catch {
      return null;
    }
  }
}
