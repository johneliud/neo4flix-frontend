import { TestBed, ComponentFixture } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { PLATFORM_ID, NO_ERRORS_SCHEMA } from '@angular/core';
import { of, throwError } from 'rxjs';
import { HttpErrorResponse } from '@angular/common/http';
import { LoginComponent } from './login.component';
import { AuthService } from '../../../core/services/auth.service';
import { NotificationService } from '../../../core/services/notification.service';

describe('LoginComponent', () => {
  let fixture: ComponentFixture<LoginComponent>;
  let component: LoginComponent;
  let authService: AuthService;
  let notifications: NotificationService;
  let router: Router;

  beforeEach(async () => {
    localStorage.clear();
    await TestBed.configureTestingModule({
      imports: [LoginComponent],
      providers: [
        provideRouter([]),
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: PLATFORM_ID, useValue: 'browser' },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();

    fixture = TestBed.createComponent(LoginComponent);
    component = fixture.componentInstance;
    authService = TestBed.inject(AuthService);
    notifications = TestBed.inject(NotificationService);
    router = TestBed.inject(Router);
    fixture.detectChanges();
  });

  afterEach(() => localStorage.clear());

  it('creates the component', () => {
    expect(component).toBeTruthy();
  });

  it('form is invalid when empty', () => {
    expect(component.loginForm.invalid).toBe(true);
  });

  it('form is valid with username and password', () => {
    component.loginForm.setValue({ username: 'john', password: 'secret' });
    expect(component.loginForm.valid).toBe(true);
  });

  it('showError() returns false before form is touched', () => {
    expect(component.showError('username')).toBe(false);
  });

  it('showError() returns true after submit with empty field', () => {
    component.onSubmit();
    expect(component.showError('username')).toBe(true);
  });

  it('getError() returns required message for empty field', () => {
    component.loginForm.get('username')!.markAsTouched();
    expect(component.getError('username')).toBe('This field is required.');
  });

  it('togglePassword() flips showPassword signal', () => {
    expect(component.showPassword()).toBe(false);
    component.togglePassword();
    expect(component.showPassword()).toBe(true);
  });

  it('navigates to / on successful login with accessToken', async () => {
    const navigateSpy = vi.spyOn(router, 'navigate');
    vi.spyOn(authService, 'login').mockReturnValue(
      of({ type: 'auth', accessToken: 'tok', refreshToken: 'rt', tokenType: 'Bearer', expiresIn: 3600 })
    );
    component.loginForm.setValue({ username: 'john', password: 'pass' });
    component.onSubmit();
    expect(navigateSpy).toHaveBeenCalledWith(['/']);
  });

  it('navigates to /2fa on MFA required response', async () => {
    const navigateSpy = vi.spyOn(router, 'navigate');
    vi.spyOn(authService, 'login').mockReturnValue(of({ type: 'mfa', mfaToken: 'mfa-tok' }));
    component.loginForm.setValue({ username: 'john', password: 'pass' });
    component.onSubmit();
    expect(navigateSpy).toHaveBeenCalledWith(['/2fa']);
  });

  it('shows error notification on 401', () => {
    const errorSpy = vi.spyOn(notifications, 'error');
    vi.spyOn(authService, 'login').mockReturnValue(
      throwError(() => new HttpErrorResponse({ status: 401 }))
    );
    component.loginForm.setValue({ username: 'john', password: 'wrong' });
    component.onSubmit();
    expect(errorSpy).toHaveBeenCalledWith('Invalid username or password.');
  });

  it('shows error notification on 403', () => {
    const errorSpy = vi.spyOn(notifications, 'error');
    vi.spyOn(authService, 'login').mockReturnValue(
      throwError(() => new HttpErrorResponse({ status: 403 }))
    );
    component.loginForm.setValue({ username: 'john', password: 'pass' });
    component.onSubmit();
    expect(errorSpy).toHaveBeenCalledWith('Your account has been locked.');
  });
});