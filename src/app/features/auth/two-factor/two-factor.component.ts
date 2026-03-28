import { Component, OnDestroy, OnInit, computed, inject, input, output, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { NgClass, NgTemplateOutlet } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { finalize } from 'rxjs';
import { from } from 'rxjs';
import QRCode from 'qrcode';
import { AuthService } from '../../../core/services/auth.service';
import { NotificationService } from '../../../core/services/notification.service';
import { TwoFactorSetupService } from '../../../core/services/two-factor-setup.service';
import { UserService } from '../../../core/services/user.service';

const TOTP_PATTERN = /^\d{6}$/;

@Component({
  selector: 'app-two-factor',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink, NgClass, NgTemplateOutlet],
  templateUrl: './two-factor.component.html',
  styleUrl: './two-factor.component.css',
})
export class TwoFactorComponent implements OnInit, OnDestroy {
  private readonly fb = inject(FormBuilder);
  private readonly authService = inject(AuthService);
  private readonly userService = inject(UserService);
  private readonly setupService = inject(TwoFactorSetupService);
  private readonly router = inject(Router);
  private readonly notifications = inject(NotificationService);

  readonly mode = input<'login' | 'setup'>('login');

  /** Emitted in setup mode once the TOTP is verified */
  readonly verified = output<void>();

  readonly isLoading = signal(false);
  readonly qrDataUrl = signal<string | null>(null);

  readonly mfaForm = this.fb.group({
    totpCode: ['', [Validators.required, Validators.pattern(TOTP_PATTERN)]],
  });

  ngOnInit(): void {
    if (this.mode() === 'login') {
      if (!this.authService.getMfaToken()) {
        this.router.navigate(['/login']);
      }
      return;
    }

    const setup = this.setupService.setup();
    if (!setup) return;
    from(QRCode.toDataURL(setup.qrCodeUri, { width: 200, margin: 2 })).subscribe((url) =>
      this.qrDataUrl.set(url),
    );
  }

  ngOnDestroy(): void {
    if (this.mode() === 'setup') {
      this.setupService.clear();
    }
  }

  readonly setupData = computed(() => this.setupService.setup());

  close(): void {
    this.authService.clearMfaToken();
    this.router.navigate(['/login']);
  }

  cancel(): void {
    this.setupService.clear();
    this.verified.emit();
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

    const totpCode = this.mfaForm.getRawValue().totpCode!;
    this.isLoading.set(true);

    if (this.mode() === 'setup') {
      this.userService
        .verify2FA(totpCode)
        .pipe(finalize(() => this.isLoading.set(false)))
        .subscribe({
          next: () => {
            this.setupService.clear();
            this.verified.emit();
          },
          error: (err: HttpErrorResponse) => {
            this.notifications.error(this.parseError(err));
          },
        });
      return;
    }

    const mfaToken = this.authService.getMfaToken();
    if (!mfaToken) {
      this.router.navigate(['/login']);
      return;
    }

    this.authService
      .verifyMfa({ mfaToken, totpCode })
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
