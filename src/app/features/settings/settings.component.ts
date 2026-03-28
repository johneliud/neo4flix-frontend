import { Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { TwoFactorComponent } from '../auth/two-factor/two-factor.component';
import { NotificationService } from '../../core/services/notification.service';
import { TwoFactorSetupService } from '../../core/services/two-factor-setup.service';
import { UserProfile, UserService } from '../../core/services/user.service';

type Step = 'idle' | 'setup' | 'disable';

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [FormsModule, TwoFactorComponent],
  templateUrl: './settings.component.html',
})
export class SettingsComponent implements OnInit {
  private readonly userService = inject(UserService);
  private readonly setupService = inject(TwoFactorSetupService);
  private readonly notifications = inject(NotificationService);

  readonly profile = signal<UserProfile | null>(null);
  readonly isLoading = signal(true);
  readonly step = signal<Step>('idle');
  readonly isBusy = signal(false);
  readonly disablePassword = signal('');

  ngOnInit(): void {
    this.userService.getProfile().subscribe({
      next: (p) => {
        this.profile.set(p);
        this.isLoading.set(false);
      },
      error: () => {
        this.notifications.error('Failed to load profile.');
        this.isLoading.set(false);
      },
    });
  }

  beginSetup(): void {
    this.isBusy.set(true);
    this.userService.setup2FA().subscribe({
      next: (res) => {
        this.setupService.setup.set(res);
        this.step.set('setup');
        this.isBusy.set(false);
      },
      error: () => {
        this.notifications.error('Failed to initiate 2FA setup.');
        this.isBusy.set(false);
      },
    });
  }

  onSetupVerified(): void {
    // Emitted by TwoFactorComponent on successful verify OR on cancel
    const wasVerified = !this.setupService.setup();
    if (wasVerified) {
      this.profile.update((p) => p && { ...p, twoFactorEnabled: true });
      this.notifications.success('Two-factor authentication enabled.');
    }
    this.step.set('idle');
  }

  beginDisable(): void {
    this.step.set('disable');
  }

  confirmDisable(): void {
    if (!this.disablePassword()) return;
    this.isBusy.set(true);
    this.userService.disable2FA(this.disablePassword()).subscribe({
      next: () => {
        this.profile.update((p) => p && { ...p, twoFactorEnabled: false });
        this.notifications.success('Two-factor authentication disabled.');
        this.disablePassword.set('');
        this.step.set('idle');
        this.isBusy.set(false);
      },
      error: () => {
        this.notifications.error('Incorrect password. Please try again.');
        this.isBusy.set(false);
      },
    });
  }

  cancelDisable(): void {
    this.disablePassword.set('');
    this.step.set('idle');
  }
}
