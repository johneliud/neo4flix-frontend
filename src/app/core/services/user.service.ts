import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface UserProfile {
  id: string;
  username: string;
  email: string;
  twoFactorEnabled: boolean;
  createdAt: string;
}

export interface TwoFactorSetupResponse {
  secret: string;
  qrCodeUri: string;
}

@Injectable({ providedIn: 'root' })
export class UserService {
  private readonly http = inject(HttpClient);

  getProfile(): Observable<UserProfile> {
    return this.http.get<UserProfile>('/api/users/profile');
  }

  setup2FA(): Observable<TwoFactorSetupResponse> {
    return this.http.post<TwoFactorSetupResponse>('/api/auth/2fa/setup', {});
  }

  verify2FA(totpCode: string): Observable<void> {
    return this.http.post<void>('/api/auth/2fa/verify', { totpCode });
  }

  disable2FA(password: string): Observable<void> {
    return this.http.post<void>('/api/auth/2fa/disable', { password });
  }
}