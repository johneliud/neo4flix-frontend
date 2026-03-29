import { TestBed } from '@angular/core/testing';
import { PLATFORM_ID } from '@angular/core';
import { ThemeService } from './theme.service';

describe('ThemeService', () => {
  let service: ThemeService;

  beforeEach(() => {
    localStorage.clear();
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [{ provide: PLATFORM_ID, useValue: 'browser' }],
    });
    service = TestBed.inject(ThemeService);
  });

  afterEach(() => {
    localStorage.clear();
    TestBed.resetTestingModule();
  });

  it('isDark signal defaults to true', () => {
    expect(service.isDark()).toBe(true);
  });

  it('toggle() switches isDark from true to false', () => {
    service.isDark.set(true);
    service.toggle();
    expect(service.isDark()).toBe(false);
  });

  it('toggle() switches isDark from false to true', () => {
    service.isDark.set(false);
    service.toggle();
    expect(service.isDark()).toBe(true);
  });

  it('apply() adds dark class when isDark is true', () => {
    service.isDark.set(true);
    service.apply();
    expect(document.documentElement.classList.contains('dark')).toBe(true);
  });

  it('apply() does not add dark class when isDark is false', () => {
    service.isDark.set(false);
    service.apply();
    expect(document.documentElement.classList.contains('dark')).toBe(false);
  });
});
