import { computed, inject, Injectable, PLATFORM_ID, signal } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { catchError, map, Observable, of, tap } from 'rxjs';

export interface LoginRequest {
  username: string;
  password: string;
}

export interface RegisterRequest {
  username: string;
  email: string;
  password: string;
}

export interface AuthResponse {
  type: 'auth';
  accessToken: string;
  tokenType: string;
  expiresIn: number;
}

export interface MfaRequiredResponse {
  type: 'mfa';
  mfaToken: string;
}

export type LoginResponse = AuthResponse | MfaRequiredResponse;

export interface TwoFactorAuthRequest {
  mfaToken: string;
  totpCode: string;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);
  private readonly platformId = inject(PLATFORM_ID);

  private readonly _token = signal<string | null>(null);
  private readonly _mfaToken = signal<string | null>(null);

  readonly isAuthenticated = computed(() => !!this._token());

  readonly currentUserId = computed<string | null>(() => {
    const token = this._token();
    if (!token) return null;
    try {
      return JSON.parse(atob(token.split('.')[1])).sub as string;
    } catch {
      return null;
    }
  });

  getToken(): string | null {
    return this._token();
  }

  setToken(token: string): void {
    this._token.set(token);
  }

  clearToken(): void {
    this._token.set(null);
  }

  getMfaToken(): string | null {
    return this._mfaToken();
  }

  setMfaToken(token: string): void {
    this._mfaToken.set(token);
  }

  clearMfaToken(): void {
    this._mfaToken.set(null);
  }

  login(body: LoginRequest): Observable<LoginResponse> {
    return this.http.post<LoginResponse>('/api/auth/login', body).pipe(
      tap((response) => {
        if ('accessToken' in response) {
          this._token.set(response.accessToken);
        }
      }),
    );
  }

  register(body: RegisterRequest): Observable<AuthResponse> {
    return this.http.post<AuthResponse>('/api/auth/register', body);
  }

  verifyMfa(body: TwoFactorAuthRequest): Observable<AuthResponse> {
    return this.http.post<AuthResponse>('/api/auth/2fa/authenticate', body).pipe(
      tap((response) => {
        this._token.set(response.accessToken);
        this.clearMfaToken();
      }),
    );
  }

  refreshToken(): Observable<AuthResponse> {
    return this.http.post<AuthResponse>('/api/auth/refresh', {}).pipe(
      tap((response) => this._token.set(response.accessToken)),
    );
  }

  /**
   * Called on app init (browser only). Silently attempts to restore the session
   * by exchanging the httpOnly refresh-token cookie for a new access token.
   */
  tryRestoreSession(): Observable<boolean> {
    if (!isPlatformBrowser(this.platformId)) return of(false);
    return this.refreshToken().pipe(
      map(() => true),
      catchError(() => of(false)),
    );
  }

  logout(): void {
    this.http
      .post('/api/auth/logout', {})
      .pipe(catchError(() => of(null)))
      .subscribe(() => {
        this._token.set(null);
        this.router.navigate(['/login']);
      });
  }
}