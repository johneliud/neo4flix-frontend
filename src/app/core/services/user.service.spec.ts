import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { UserService, UserProfile, TwoFactorSetupResponse } from './user.service';

const PROFILE: UserProfile = {
  id: 'u1', username: 'john', email: 'john@test.com', twoFactorEnabled: false, createdAt: '2024-01-01',
};

const TWO_FA_SETUP: TwoFactorSetupResponse = {
  secret: 'secret123',
  qrCodeUri: 'otpauth://totp/Neo4flix:john@test.com?secret=secret123',
};

describe('UserService', () => {
  let service: UserService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(UserService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('getProfile() sends GET to /api/users/profile', () => {
    service.getProfile().subscribe();
    const req = http.expectOne('/api/users/profile');
    expect(req.request.method).toBe('GET');
    req.flush(PROFILE);
  });

  it('setup2FA() sends POST to /api/auth/2fa/setup', () => {
    service.setup2FA().subscribe();
    const req = http.expectOne('/api/auth/2fa/setup');
    expect(req.request.method).toBe('POST');
    req.flush(TWO_FA_SETUP);
  });

  it('verify2FA() sends POST to /api/auth/2fa/verify with totpCode', () => {
    service.verify2FA('123456').subscribe();
    const req = http.expectOne('/api/auth/2fa/verify');
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({ totpCode: '123456' });
    req.flush(null);
  });

  it('disable2FA() sends POST to /api/auth/2fa/disable with password', () => {
    service.disable2FA('password123').subscribe();
    const req = http.expectOne('/api/auth/2fa/disable');
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({ password: 'password123' });
    req.flush(null);
  });
});
