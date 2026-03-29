import { TestBed, ComponentFixture } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { PLATFORM_ID, NO_ERRORS_SCHEMA } from '@angular/core';
import { of, throwError } from 'rxjs';
import { HomeComponent } from './home.component';
import { MovieService, PagedResponse, Movie } from '../../core/services/movie.service';
import { NotificationService } from '../../core/services/notification.service';

const MOVIE: Movie = {
  id: 'm1', title: 'Test Movie', genres: ['Action'], releaseYear: 2020,
  description: 'desc', posterUrl: null, averageRating: 4.0, createdAt: '2024-01-01',
};
const PAGE: PagedResponse<Movie> = { content: [MOVIE], page: 0, size: 15, totalElements: 1, totalPages: 1 };

describe('HomeComponent', () => {
  let fixture: ComponentFixture<HomeComponent>;
  let component: HomeComponent;
  let movieService: MovieService;
  let notifications: NotificationService;

  beforeEach(async () => {
    localStorage.clear();
    await TestBed.configureTestingModule({
      imports: [HomeComponent],
      providers: [
        provideRouter([]),
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: PLATFORM_ID, useValue: 'browser' },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();

    movieService = TestBed.inject(MovieService);
    notifications = TestBed.inject(NotificationService);
  });

  const createFixture = () => {
    fixture = TestBed.createComponent(HomeComponent);
    component = fixture.componentInstance;
  };

  afterEach(() => localStorage.clear());

  it('creates the component', () => {
    vi.spyOn(movieService, 'getMovies').mockReturnValue(of(PAGE));
    createFixture();
    fixture.detectChanges();
    expect(component).toBeTruthy();
  });

  it('calls getMovies on init', () => {
    const spy = vi.spyOn(movieService, 'getMovies').mockReturnValue(of(PAGE));
    createFixture();
    fixture.detectChanges();
    expect(spy).toHaveBeenCalledWith(0, 15);
  });

  it('populates movies signal from response', () => {
    vi.spyOn(movieService, 'getMovies').mockReturnValue(of(PAGE));
    createFixture();
    fixture.detectChanges();
    expect(component.movies()).toHaveLength(1);
    expect(component.movies()[0].title).toBe('Test Movie');
  });

  it('sets totalElements and totalPages from response', () => {
    vi.spyOn(movieService, 'getMovies').mockReturnValue(of(PAGE));
    createFixture();
    fixture.detectChanges();
    expect(component.totalElements()).toBe(1);
    expect(component.totalPages()).toBe(1);
  });

  it('isLoading starts true and becomes false after load', () => {
    vi.spyOn(movieService, 'getMovies').mockReturnValue(of(PAGE));
    createFixture();
    expect(component.isLoading()).toBe(true);
    fixture.detectChanges();
    expect(component.isLoading()).toBe(false);
  });

  it('sets hasError on failure', () => {
    vi.spyOn(movieService, 'getMovies').mockReturnValue(throwError(() => new Error('fail')));
    createFixture();
    fixture.detectChanges();
    expect(component.hasError()).toBe(true);
  });

  it('shows error notification on failure', () => {
    const errorSpy = vi.spyOn(notifications, 'error');
    vi.spyOn(movieService, 'getMovies').mockReturnValue(throwError(() => new Error('fail')));
    createFixture();
    fixture.detectChanges();
    expect(errorSpy).toHaveBeenCalled();
  });

  it('pageRangeLabel computed reflects current page and total', () => {
    vi.spyOn(movieService, 'getMovies').mockReturnValue(of(PAGE));
    createFixture();
    fixture.detectChanges();
    expect(component.pageRangeLabel()).toBe('Showing 1–1 of 1');
  });
});