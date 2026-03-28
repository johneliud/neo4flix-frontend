import { Injectable, signal } from '@angular/core';
import { TwoFactorSetupResponse } from './user.service';

@Injectable({ providedIn: 'root' })
export class TwoFactorSetupService {
  readonly setup = signal<TwoFactorSetupResponse | null>(null);

  clear(): void {
    this.setup.set(null);
  }
}