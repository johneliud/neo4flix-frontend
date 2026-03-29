import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { provideRouter, Routes } from '@angular/router';
import { PLATFORM_ID, Component } from '@angular/core';
import { AuthService } from './auth.service';

const MOCK_TOKEN = 'header.' + btoa(JSON.stringify({ sub: 'test-user-id', exp: 9999999999 })) + '.sig';

@Component({ template: '' })
class DummyComponent {}

const routes: Routes = [
  { path: 'login', component: DummyComponent },
  { path: '**', component: DummyComponent },
];

describe('AuthService', () => {
  let service: AuthService;
  let http: HttpTestingController;

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter(routes),
        { provide: PLATFORM_ID, useValue: 'browser' },
      ],
    });
    service = TestBed.inject(AuthService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    http.verify();
    localStorage.clear();
  });

  it('isAuthenticated() is false when no token is stored', () => {
    expect(service.isAuthenticated()).toBe(false);
  });

  it('isAuthenticated() is true after setToken()', () => {
    service.setToken(MOCK_TOKEN);
    expect(service.isAuthenticated()).toBe(true);
  });

  it('isAuthenticated() is false after clearToken()', () => {
    service.setToken(MOCK_TOKEN);
    service.clearToken();
    expect(service.isAuthenticated()).toBe(false);
  });

  it('currentUserId() extracts sub claim from token', () => {
    service.setToken(MOCK_TOKEN);
    expect(service.currentUserId()).toBe('test-user-id');
  });

  it('currentUserId() returns null when no token', () => {
    expect(service.currentUserId()).toBeNull();
  });

  it('getToken() returns stored token', () => {
    service.setToken(MOCK_TOKEN);
    expect(service.getToken()).toBe(MOCK_TOKEN);
  });

  it('login() sends POST to /api/auth/login', () => {
    service.login({ username: 'john', password: 'pass' }).subscribe();
    const req = http.expectOne('/api/auth/login');
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({ username: 'john', password: 'pass' });
    req.flush({ type: 'auth', accessToken: MOCK_TOKEN, refreshToken: 'rt', tokenType: 'Bearer', expiresIn: 3600 });
  });

  it('login() stores token when response contains accessToken', () => {
    service.login({ username: 'john', password: 'pass' }).subscribe();
    http.expectOne('/api/auth/login').flush({
      type: 'auth', accessToken: MOCK_TOKEN, refreshToken: 'rt', tokenType: 'Bearer', expiresIn: 3600,
    });
    expect(service.getToken()).toBe(MOCK_TOKEN);
  });

  it('register() sends POST to /api/auth/register', () => {
    service.register({ username: 'john', email: 'john@test.com', password: 'Pass1!' }).subscribe();
    const req = http.expectOne('/api/auth/register');
    expect(req.request.method).toBe('POST');
    req.flush({ type: 'auth', accessToken: MOCK_TOKEN, refreshToken: 'rt', tokenType: 'Bearer', expiresIn: 3600 });
  });

  it('logout() clears token', () => {
    service.setToken(MOCK_TOKEN);
    service.logout();
    expect(service.isAuthenticated()).toBe(false);
  });
});