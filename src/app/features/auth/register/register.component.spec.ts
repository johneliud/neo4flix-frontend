import { TestBed, ComponentFixture } from '@angular/core/testing';
import { provideRouter, Router, Routes } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { PLATFORM_ID, NO_ERRORS_SCHEMA, Component } from '@angular/core';
import { of, throwError } from 'rxjs';
import { HttpErrorResponse } from '@angular/common/http';
import { RegisterComponent } from './register.component';
import { AuthService } from '../../../core/services/auth.service';
import { NotificationService } from '../../../core/services/notification.service';

const VALID_FORM = { username: 'johndoe', email: 'john@test.com', password: 'Password1!', confirmPassword: 'Password1!' };

@Component({ template: '' })
class DummyComponent {}

const routes: Routes = [
  { path: 'login', component: DummyComponent },
  { path: '**', component: DummyComponent },
];

describe('RegisterComponent', () => {
  let fixture: ComponentFixture<RegisterComponent>;
  let component: RegisterComponent;
  let authService: AuthService;
  let notifications: NotificationService;
  let router: Router;

  beforeEach(async () => {
    localStorage.clear();
    await TestBed.configureTestingModule({
      imports: [RegisterComponent],
      providers: [
        provideRouter(routes),
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: PLATFORM_ID, useValue: 'browser' },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();

    fixture = TestBed.createComponent(RegisterComponent);
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
    expect(component.registerForm.invalid).toBe(true);
  });

  it('form is valid with all correct fields', () => {
    component.registerForm.setValue(VALID_FORM);
    expect(component.registerForm.valid).toBe(true);
  });

  it('form is invalid when passwords do not match', () => {
    component.registerForm.setValue({ ...VALID_FORM, confirmPassword: 'Different1!' });
    expect(component.registerForm.errors?.['passwordMismatch']).toBe(true);
  });

  it('username field requires minLength of 3', () => {
    component.registerForm.setValue({ ...VALID_FORM, username: 'ab' });
    expect(component.registerForm.get('username')?.errors?.['minlength']).toBeTruthy();
  });

  it('email field validates format', () => {
    component.registerForm.setValue({ ...VALID_FORM, email: 'not-an-email' });
    expect(component.registerForm.get('email')?.errors?.['email']).toBeTruthy();
  });

  it('password field enforces pattern (uppercase, digit, special char)', () => {
    component.registerForm.setValue({ ...VALID_FORM, password: 'weakpassword', confirmPassword: 'weakpassword' });
    expect(component.registerForm.get('password')?.errors?.['pattern']).toBeTruthy();
  });

  it('getError() returns minlength message for short username', () => {
    component.registerForm.get('username')!.setValue('ab');
    component.registerForm.get('username')!.markAsTouched();
    expect(component.getError('username')).toContain('at least');
  });

  it('navigates to /login on successful registration', () => {
    const navigateSpy = vi.spyOn(router, 'navigate');
    vi.spyOn(authService, 'register').mockReturnValue(
      of({ type: 'auth', accessToken: 'tok', refreshToken: 'rt', tokenType: 'Bearer', expiresIn: 3600 })
    );
    component.registerForm.setValue(VALID_FORM);
    component.onSubmit();
    expect(navigateSpy).toHaveBeenCalledWith(['/login']);
  });

  it('shows success notification on successful registration', () => {
    const successSpy = vi.spyOn(notifications, 'success');
    vi.spyOn(authService, 'register').mockReturnValue(
      of({ type: 'auth', accessToken: 'tok', refreshToken: 'rt', tokenType: 'Bearer', expiresIn: 3600 })
    );
    component.registerForm.setValue(VALID_FORM);
    component.onSubmit();
    expect(successSpy).toHaveBeenCalledWith('Account created! You can now sign in.');
  });

  it('shows conflict error message on 409', () => {
    const errorSpy = vi.spyOn(notifications, 'error');
    vi.spyOn(authService, 'register').mockReturnValue(
      throwError(() => new HttpErrorResponse({ status: 409 }))
    );
    component.registerForm.setValue(VALID_FORM);
    component.onSubmit();
    expect(errorSpy).toHaveBeenCalledWith('This username or email is already in use.');
  });
});