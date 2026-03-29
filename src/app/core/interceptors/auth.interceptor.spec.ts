import { TestBed } from '@angular/core/testing';
import { provideHttpClient, withInterceptors, HttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { PLATFORM_ID } from '@angular/core';
import { authInterceptor } from './auth.interceptor';
import { AuthService } from '../services/auth.service';
import { provideRouter } from '@angular/router';

const MOCK_TOKEN = 'h.' + btoa(JSON.stringify({ sub: 'u1', exp: 9999999999 })) + '.s';

describe('authInterceptor', () => {
  let http: HttpClient;
  let httpController: HttpTestingController;
  let authService: AuthService;

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        provideHttpClient(withInterceptors([authInterceptor])),
        provideHttpClientTesting(),
        { provide: PLATFORM_ID, useValue: 'browser' },
      ],
    });
    http = TestBed.inject(HttpClient);
    httpController = TestBed.inject(HttpTestingController);
    authService = TestBed.inject(AuthService);
  });

  afterEach(() => {
    httpController.verify();
    localStorage.clear();
  });

  it('attaches Authorization header when token present and URL contains /api', () => {
    authService.setToken(MOCK_TOKEN);
    http.get('/api/movies').subscribe();
    const req = httpController.expectOne('/api/movies');
    expect(req.request.headers.get('Authorization')).toBe(`Bearer ${MOCK_TOKEN}`);
    req.flush([]);
  });

  it('does not attach Authorization header when no token', () => {
    http.get('/api/movies').subscribe();
    const req = httpController.expectOne('/api/movies');
    expect(req.request.headers.has('Authorization')).toBe(false);
    req.flush([]);
  });

  it('does not attach Authorization header for non-/api URLs', () => {
    authService.setToken(MOCK_TOKEN);
    http.get('https://cdn.example.com/image.jpg').subscribe();
    const req = httpController.expectOne('https://cdn.example.com/image.jpg');
    expect(req.request.headers.has('Authorization')).toBe(false);
    req.flush('');
  });
});