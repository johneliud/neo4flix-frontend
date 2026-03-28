import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { NgClass } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { finalize } from 'rxjs';
import { AuthService } from '../../../core/services/auth.service';
import { NotificationService } from '../../../core/services/notification.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink, NgClass],
  templateUrl: './login.component.html',
  styleUrl: './login.component.css',
})
export class LoginComponent {
  private readonly fb = inject(FormBuilder);
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  private readonly notifications = inject(NotificationService);

  readonly showPassword = signal(false);
  readonly isLoading = signal(false);

  readonly loginForm = this.fb.group({
    username: ['', [Validators.required]],
    password: ['', [Validators.required]],
  });

  togglePassword(): void {
    this.showPassword.update((v) => !v);
  }

  showError(field: string): boolean {
    const ctrl = this.loginForm.get(field);
    return !!ctrl?.invalid && !!(ctrl.dirty || ctrl.touched);
  }

  getError(field: string): string {
    const errors = this.loginForm.get(field)?.errors;
    if (!errors) return '';
    if (errors['required']) return 'This field is required.';
    return '';
  }

  onSubmit(): void {
    if (this.loginForm.invalid) {
      this.loginForm.markAllAsTouched();
      return;
    }

    this.isLoading.set(true);

    const { username, password } = this.loginForm.getRawValue();

    this.authService
      .login({ username: username!, password: password! })
      .pipe(finalize(() => this.isLoading.set(false)))
      .subscribe({
        next: (response) => {
          if ('accessToken' in response) {
            this.router.navigate(['/']);
          } else {
            this.authService.setMfaToken(response.mfaToken);
            this.router.navigate(['/2fa']);
          }
        },
        error: (err: HttpErrorResponse) => {
          this.notifications.error(this.parseError(err));
        },
      });
  }

  private parseError(err: HttpErrorResponse): string {
    if (err.status === 401) return 'Invalid username or password.';
    if (err.status === 403) return 'Your account has been locked.';
    if (err.status === 429) return 'Too many attempts. Please try again later.';
    if (err.status >= 500) return 'Something went wrong. Please try again.';
    return err.error?.message ?? 'An unexpected error occurred.';
  }
}