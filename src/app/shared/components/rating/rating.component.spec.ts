import { TestBed, ComponentFixture } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { PLATFORM_ID, NO_ERRORS_SCHEMA } from '@angular/core';
import { of, throwError } from 'rxjs';
import { HttpErrorResponse } from '@angular/common/http';
import { RatingComponent } from './rating.component';
import { RatingService, RatingResponse } from '../../../core/services/rating.service';
import { AuthService } from '../../../core/services/auth.service';
import { NotificationService } from '../../../core/services/notification.service';
import { provideRouter } from '@angular/router';

const MOCK_TOKEN = 'h.' + btoa(JSON.stringify({ sub: 'user-1', exp: 9999999999 })) + '.s';
const RATING: RatingResponse = { id: 'r1', userId: 'user-1', movieId: 'movie-1', score: 3, ratedAt: '2024-01-01T00:00:00' };

describe('RatingComponent', () => {
  let fixture: ComponentFixture<RatingComponent>;
  let component: RatingComponent;
  let ratingService: RatingService;
  let authService: AuthService;
  let notifications: NotificationService;

  const createComponent = (hasExistingRating = false) => {
    vi.spyOn(ratingService, 'getByMovie').mockReturnValue(of(hasExistingRating ? [RATING] : []));
    fixture = TestBed.createComponent(RatingComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('movieId', 'movie-1');
    fixture.detectChanges();
  };

  beforeEach(async () => {
    localStorage.clear();
    await TestBed.configureTestingModule({
      imports: [RatingComponent],
      providers: [
        provideRouter([]),
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: PLATFORM_ID, useValue: 'browser' },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();

    ratingService = TestBed.inject(RatingService);
    authService = TestBed.inject(AuthService);
    notifications = TestBed.inject(NotificationService);
    authService.setToken(MOCK_TOKEN);
  });

  afterEach(() => localStorage.clear());

  it('creates the component', () => {
    createComponent();
    expect(component).toBeTruthy();
  });

  it('loads existing rating for current user on init', () => {
    createComponent(true);
    expect(component.userRating()?.score).toBe(3);
  });

  it('userRating is null when user has no rating', () => {
    createComponent(false);
    expect(component.userRating()).toBeNull();
  });

  it('activeScore() returns hovered value when hovering', () => {
    createComponent(true);
    component.hovered.set(5);
    expect(component.activeScore()).toBe(5);
  });

  it('activeScore() returns userRating score when not hovering', () => {
    createComponent(true);
    expect(component.activeScore()).toBe(3);
  });

  it('activeScore() returns 0 when no rating and not hovering', () => {
    createComponent(false);
    expect(component.activeScore()).toBe(0);
  });

  it('onStar() calls create when no existing rating', () => {
    const createSpy = vi.spyOn(ratingService, 'create').mockReturnValue(of({ ...RATING, score: 4 }));
    createComponent(false);
    component.onStar(4);
    expect(createSpy).toHaveBeenCalledWith('movie-1', 4);
  });

  it('onStar() calls update when existing rating with different score', () => {
    const updateSpy = vi.spyOn(ratingService, 'update').mockReturnValue(of({ ...RATING, score: 5 }));
    createComponent(true);
    component.onStar(5);
    expect(updateSpy).toHaveBeenCalledWith('r1', 5);
  });

  it('onStar() calls delete when clicking same score as existing rating', () => {
    const deleteSpy = vi.spyOn(ratingService, 'delete').mockReturnValue(of(undefined));
    createComponent(true);
    component.onStar(3); // same as RATING.score
    expect(deleteSpy).toHaveBeenCalledWith('r1');
  });

  it('userRating becomes null after delete', () => {
    vi.spyOn(ratingService, 'delete').mockReturnValue(of(undefined));
    createComponent(true);
    component.onStar(3);
    expect(component.userRating()).toBeNull();
  });

  it('shows error notification on create failure', () => {
    const errorSpy = vi.spyOn(notifications, 'error');
    vi.spyOn(ratingService, 'create').mockReturnValue(throwError(() => new HttpErrorResponse({ status: 500 })));
    createComponent(false);
    component.onStar(4);
    expect(errorSpy).toHaveBeenCalled();
  });
});