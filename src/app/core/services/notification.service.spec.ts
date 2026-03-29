import { TestBed } from '@angular/core/testing';
import { PLATFORM_ID } from '@angular/core';
import { NotificationService } from './notification.service';

describe('NotificationService', () => {
  let service: NotificationService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [{ provide: PLATFORM_ID, useValue: 'browser' }],
    });
    service = TestBed.inject(NotificationService);
  });

  it('notification signal starts null', () => {
    expect(service.notification()).toBeNull();
  });

  it('success() sets notification with success type', () => {
    service.success('Operation successful');
    expect(service.notification()).toEqual({ type: 'success', message: 'Operation successful' });
  });

  it('error() sets notification with error type', () => {
    service.error('Something went wrong');
    expect(service.notification()).toEqual({ type: 'error', message: 'Something went wrong' });
  });

  it('dismiss() clears notification', () => {
    service.success('Test');
    service.dismiss();
    expect(service.notification()).toBeNull();
  });

  it('success() accepts custom duration parameter', () => {
    service.success('Custom duration', 5000);
    expect(service.notification()).toEqual({ type: 'success', message: 'Custom duration' });
  });

  it('error() accepts custom duration parameter', () => {
    service.error('Error with duration', 7000);
    expect(service.notification()).toEqual({ type: 'error', message: 'Error with duration' });
  });
});
