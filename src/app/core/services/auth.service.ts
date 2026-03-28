import { computed, inject, Injectable, PLATFORM_ID, signal } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, tap } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface LoginRequest {
  username: string;
  password: string;
}

export interface RegisterRequest {
  username: string;
  email: string;
  password: string;
}

export interface RefreshTokenRequest {
  refreshToken: string;
}

export interface AuthResponse {
  type: 'auth';
  accessToken: string;
  refreshToken: string;
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

const TOKEN_KEY = environment.tokenKey;
const REFRESH_KEY = environment.refreshTokenKey;

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);
  private readonly platformId = inject(PLATFORM_ID);

  private readonly _token = signal<string | null>(this.loadToken());
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

  private loadToken(): string | null {
    if (!isPlatformBrowser(this.platformId)) return null;
    return localStorage.getItem(TOKEN_KEY);
  }

  getToken(): string | null {
    return this._token();
  }

  setToken(token: string): void {
    if (isPlatformBrowser(this.platformId)) {
      localStorage.setItem(TOKEN_KEY, token);
    }
    this._token.set(token);
  }

  setRefreshToken(token: string): void {
    if (isPlatformBrowser(this.platformId)) {
      localStorage.setItem(REFRESH_KEY, token);
    }
  }

  getRefreshToken(): string | null {
    if (!isPlatformBrowser(this.platformId)) return null;
    return localStorage.getItem(REFRESH_KEY);
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

  clearToken(): void {
    if (isPlatformBrowser(this.platformId)) {
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(REFRESH_KEY);
    }
    this._token.set(null);
  }

  login(body: LoginRequest): Observable<LoginResponse> {
    return this.http.post<LoginResponse>('/api/auth/login', body).pipe(
      tap((response) => {
        if ('accessToken' in response) {
          this.setToken(response.accessToken);
          this.setRefreshToken(response.refreshToken);
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
        this.setToken(response.accessToken);
        this.setRefreshToken(response.refreshToken);
        this.clearMfaToken();
      }),
    );
  }

  refreshToken(body: RefreshTokenRequest): Observable<AuthResponse> {
    return this.http.post<AuthResponse>('/api/auth/refresh', body).pipe(
      tap((response) => {
        this.setToken(response.accessToken);
        this.setRefreshToken(response.refreshToken);
      }),
    );
  }

  logout(): void {
    this.clearToken();
    this.router.navigate(['/login']);
  }
}
