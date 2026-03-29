import { TestBed, ComponentFixture } from '@angular/core/testing';
import { ActivatedRoute, Router, convertToParamMap } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { PLATFORM_ID, NO_ERRORS_SCHEMA } from '@angular/core';
import { Observable, of, Subject } from 'rxjs';
import { ParamMap } from '@angular/router';
import { MovieDetailComponent } from './movie-detail.component';
import { MovieService, Movie } from '../../../core/services/movie.service';
import { RecommendationService, PagedRecommendations } from '../../../core/services/recommendation.service';
import { WatchlistService } from '../../../core/services/watchlist.service';
import { NotificationService } from '../../../core/services/notification.service';
import { AuthService } from '../../../core/services/auth.service';
import { provideRouter } from '@angular/router';

const MOVIE: Movie = {
  id: 'm1', title: 'Inception', genres: ['Sci-Fi'], releaseYear: 2010,
  description: 'Mind-bending.', posterUrl: null, averageRating: 4.8, createdAt: '2024-01-01',
};
const EMPTY_RECS: PagedRecommendations = { content: [], page: 0, size: 12, totalElements: 0, totalPages: 0 };

describe('MovieDetailComponent', () => {
  let fixture: ComponentFixture<MovieDetailComponent>;
  let component: MovieDetailComponent;
  let movieService: MovieService;
  let recService: RecommendationService;
  let watchlistService: WatchlistService;
  let notifications: NotificationService;
  let router: Router;
  let paramMapSubject: Subject<ParamMap>;

  beforeEach(async () => {
    localStorage.clear();
    paramMapSubject = new Subject<ParamMap>();

    await TestBed.configureTestingModule({
      imports: [MovieDetailComponent],
      providers: [
        provideRouter([]),
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: PLATFORM_ID, useValue: 'browser' },
        {
          provide: ActivatedRoute,
          useValue: { paramMap: paramMapSubject.asObservable() },
        },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();

    movieService = TestBed.inject(MovieService);
    recService = TestBed.inject(RecommendationService);
    watchlistService = TestBed.inject(WatchlistService);
    notifications = TestBed.inject(NotificationService);
    router = TestBed.inject(Router);

    vi.spyOn(recService, 'getRecommendations').mockReturnValue(of(EMPTY_RECS));
    vi.spyOn(watchlistService, 'loadOnce').mockImplementation(() => {});
  });

  const createAndEmit = (id: string | null) => {
    fixture = TestBed.createComponent(MovieDetailComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
    paramMapSubject.next(convertToParamMap(id ? { id } : {}));
    fixture.detectChanges();
  };

  afterEach(() => localStorage.clear());

  it('creates the component', () => {
    vi.spyOn(movieService, 'getMovieById').mockReturnValue(of(MOVIE));
    createAndEmit('m1');
    expect(component).toBeTruthy();
  });

  it('loads movie when id param is present', () => {
    const spy = vi.spyOn(movieService, 'getMovieById').mockReturnValue(of(MOVIE));
    createAndEmit('m1');
    expect(spy).toHaveBeenCalledWith('m1');
    expect(component.movie()?.title).toBe('Inception');
  });

  it('navigates away when no id param', () => {
    const navigateSpy = vi.spyOn(router, 'navigate');
    createAndEmit(null);
    expect(navigateSpy).toHaveBeenCalledWith(['/']);
  });

  it('sets hasError on movie load failure', () => {
    vi.spyOn(movieService, 'getMovieById').mockReturnValue(
      new Observable((obs) => obs.error(new Error('fail')))
    );
    createAndEmit('m1');
    expect(component.hasError()).toBe(true);
  });

  it('isLoading starts true and becomes false after movie loads', () => {
    vi.spyOn(movieService, 'getMovieById').mockReturnValue(of(MOVIE));
    fixture = TestBed.createComponent(MovieDetailComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
    expect(component.isLoading()).toBe(true);
    paramMapSubject.next(convertToParamMap({ id: 'm1' }));
    fixture.detectChanges();
    expect(component.isLoading()).toBe(false);
  });

  it('inWatchlist() reflects watchlistService state', () => {
    vi.spyOn(movieService, 'getMovieById').mockReturnValue(of(MOVIE));
    createAndEmit('m1');
    expect(component.inWatchlist()).toBe(false);

    const ids = new Set(['m1']);
    watchlistService.watchlistIds.set(ids);
    expect(component.inWatchlist()).toBe(true);
  });

  it('formattedRating() returns N/A for null', () => {
    vi.spyOn(movieService, 'getMovieById').mockReturnValue(of(MOVIE));
    createAndEmit('m1');
    expect(component.formattedRating(null)).toBe('N/A');
  });

  it('formattedRating() formats number to 1 decimal', () => {
    vi.spyOn(movieService, 'getMovieById').mockReturnValue(of(MOVIE));
    createAndEmit('m1');
    expect(component.formattedRating(4.789)).toBe('4.8');
  });
});