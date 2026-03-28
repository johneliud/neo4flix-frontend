import { Injectable, PLATFORM_ID, inject, signal } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

export type NotificationType = 'success' | 'error';

export interface Notification {
  type: NotificationType;
  message: string;
}

@Injectable({ providedIn: 'root' })
export class NotificationService {
  private readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID));
  private readonly _notification = signal<Notification | null>(null);
  readonly notification = this._notification.asReadonly();

  private timer: ReturnType<typeof setTimeout> | null = null;

  success(message: string, duration = 3000): void {
    this.show({ type: 'success', message }, duration);
  }

  error(message: string, duration = 3000): void {
    this.show({ type: 'error', message }, duration);
  }

  dismiss(): void {
    if (this.timer !== null) {
      clearTimeout(this.timer);
      this.timer = null;
    }
    this._notification.set(null);
  }

  private show(notification: Notification, duration: number): void {
    if (this.timer !== null) {
      clearTimeout(this.timer);
    }
    this._notification.set(notification);
    if (this.isBrowser) {
      this.timer = setTimeout(() => {
        this._notification.set(null);
        this.timer = null;
      }, duration);
    }
  }
}