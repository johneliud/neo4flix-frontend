import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { NgClass } from '@angular/common';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink, NgClass],
  templateUrl: './login.component.html',
  styleUrl: './login.component.css',
})
export class LoginComponent {
  private readonly fb = inject(FormBuilder);

  readonly showPassword = signal(false);

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
    // TODO: integrate AuthService.login() — checkpoint 3
  }
}