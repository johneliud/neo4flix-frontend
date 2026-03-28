import { Component, inject, signal } from '@angular/core';
import {
  AbstractControl,
  FormBuilder,
  ReactiveFormsModule,
  ValidationErrors,
  Validators,
} from '@angular/forms';
import { NgClass } from '@angular/common';
import { RouterLink } from '@angular/router';

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

  readonly showPassword = signal(false);
  readonly showConfirmPassword = signal(false);

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
    // TODO: integrate AuthService.register() — checkpoint 3
  }
}