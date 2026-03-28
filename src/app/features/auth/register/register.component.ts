import { Component, inject, signal } from '@angular/core';
import {
  AbstractControl,
  FormBuilder,
  ReactiveFormsModule,
  ValidationErrors,
  Validators,
} from '@angular/forms';
import { NgClass } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { finalize } from 'rxjs';
import { AuthService } from '../../../core/services/auth.service';
import { NotificationService } from '../../../core/services/notification.service';

function passwordMatchValidator(form: AbstractControl): ValidationErrors | null {
  const pw = form.get('password')?.value;
  const confirm = form.get('confirmPassword')?.value;
  return pw === confirm ? null : { passwordMismatch: true };
}

// Pattern: ≥8 chars, 1 uppercase, 1 digit, 1 special char
const PASSWORD_PATTERN = /^(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&]).{8,}$/;

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink, NgClass],
  templateUrl: './register.component.html',
  styleUrl: './register.component.css',
})
export class RegisterComponent {
  private readonly fb = inject(FormBuilder);
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  private readonly notifications = inject(NotificationService);

  readonly showPassword = signal(false);
  readonly showConfirmPassword = signal(false);
  readonly isLoading = signal(false);

  readonly registerForm = this.fb.group(
    {
      username: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(50)]],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(8), Validators.pattern(PASSWORD_PATTERN)]],
      confirmPassword: ['', [Validators.required]],
    },
    { validators: passwordMatchValidator },
  );

  togglePassword(): void {
    this.showPassword.update((v) => !v);
  }

  toggleConfirmPassword(): void {
    this.showConfirmPassword.update((v) => !v);
  }

  showError(field: string): boolean {
    const ctrl = this.registerForm.get(field);
    return !!ctrl?.invalid && !!(ctrl.dirty || ctrl.touched);
  }

  getError(field: string): string {
    const errors = this.registerForm.get(field)?.errors;
    if (!errors) return '';
    if (errors['required']) return 'This field is required.';
    if (errors['minlength']) return `Must be at least ${errors['minlength'].requiredLength} characters.`;
    if (errors['maxlength']) return `Must be no more than ${errors['maxlength'].requiredLength} characters.`;
    if (errors['email']) return 'Enter a valid email address.';
    if (errors['pattern']) return 'Must contain uppercase, number, and special character (@$!%*?&).';
    return '';
  }

  showConfirmPasswordError(): boolean {
    const ctrl = this.registerForm.get('confirmPassword');
    if (!ctrl || !(ctrl.dirty || ctrl.touched)) return false;
    return ctrl.invalid || !!this.registerForm.errors?.['passwordMismatch'];
  }

  getConfirmPasswordError(): string {
    const ctrl = this.registerForm.get('confirmPassword');
    if (ctrl?.errors?.['required']) return 'This field is required.';
    if (this.registerForm.errors?.['passwordMismatch']) return 'Passwords do not match.';
    return '';
  }

  onSubmit(): void {
    if (this.registerForm.invalid) {
      this.registerForm.markAllAsTouched();
      return;
    }

    this.isLoading.set(true);

    const { username, email, password } = this.registerForm.getRawValue();

    this.authService
      .register({ username: username!, email: email!, password: password! })
      .pipe(finalize(() => this.isLoading.set(false)))
      .subscribe({
        next: () => {
          this.notifications.success('Account created! You can now sign in.');
          this.router.navigate(['/login']);
        },
        error: (err: HttpErrorResponse) => {
          this.notifications.error(this.parseError(err));
        },
      });
  }

  private parseError(err: HttpErrorResponse): string {
    if (err.status === 409) return 'This username or email is already in use.';
    if (err.status === 400) return err.error?.message ?? 'Invalid data. Please check your inputs.';
    if (err.status >= 500) return 'Something went wrong. Please try again.';
    return err.error?.message ?? 'An unexpected error occurred.';
  }
}