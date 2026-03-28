import { Component, inject, OnInit, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { NgClass } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { finalize } from 'rxjs';
import { AuthService } from '../../../core/services/auth.service';
import { NotificationService } from '../../../core/services/notification.service';

const TOTP_PATTERN = /^\d{6}$/;

@Component({
  selector: 'app-two-factor',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink, NgClass],
  templateUrl: './two-factor.component.html',
  styleUrl: './two-factor.component.css',
})
export class TwoFactorComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  private readonly notifications = inject(NotificationService);

  readonly isLoading = signal(false);

  readonly mfaForm = this.fb.group({
    totpCode: ['', [Validators.required, Validators.pattern(TOTP_PATTERN)]],
  });

  ngOnInit(): void {
    if (!this.authService.getMfaToken()) {
      this.router.navigate(['/login']);
    }
  }

  showError(): boolean {
    const ctrl = this.mfaForm.get('totpCode');
    return !!ctrl?.invalid && !!(ctrl.dirty || ctrl.touched);
  }

  getError(): string {
    const errors = this.mfaForm.get('totpCode')?.errors;
    if (!errors) return '';
    if (errors['required']) return 'This field is required.';
    if (errors['pattern']) return 'Enter a valid 6-digit code.';
    return '';
  }

  onSubmit(): void {
    if (this.mfaForm.invalid) {
      this.mfaForm.markAllAsTouched();
      return;
    }

    const mfaToken = this.authService.getMfaToken();
    if (!mfaToken) {
      this.router.navigate(['/login']);
      return;
    }

    this.isLoading.set(true);

    this.authService
      .verifyMfa({ mfaToken, totpCode: this.mfaForm.getRawValue().totpCode! })
      .pipe(finalize(() => this.isLoading.set(false)))
      .subscribe({
        next: () => this.router.navigate(['/']),
        error: (err: HttpErrorResponse) => {
          this.notifications.error(this.parseError(err));
        },
      });
  }

  private parseError(err: HttpErrorResponse): string {
    if (err.status === 401) return 'Invalid or expired code. Please try again.';
    if (err.status === 429) return 'Too many attempts. Please try again later.';
    if (err.status >= 500) return 'Something went wrong. Please try again.';
    return err.error?.message ?? 'An unexpected error occurred.';
  }
}