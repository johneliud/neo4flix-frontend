import { TestBed, ComponentFixture } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { PLATFORM_ID, NO_ERRORS_SCHEMA } from '@angular/core';
import { of, throwError } from 'rxjs';
import { RecommendationsComponent } from './recommendations.component';
import { RecommendationService, PagedRecommendations, RecommendationMovie } from '../../core/services/recommendation.service';
import { MovieService } from '../../core/services/movie.service';

const REC: RecommendationMovie = {
  id: 'm1', title: 'Rec Movie', genres: ['Drama'], releaseYear: 2019,
  description: 'desc', posterUrl: null, averageRating: 4.2, relevanceScore: 3,
};
const PAGE: PagedRecommendations = { content: [REC], page: 0, size: 20, totalElements: 1, totalPages: 1 };
const EMPTY: PagedRecommendations = { content: [], page: 0, size: 20, totalElements: 0, totalPages: 0 };

describe('RecommendationsComponent', () => {
  let fixture: ComponentFixture<RecommendationsComponent>;
  let component: RecommendationsComponent;
  let recService: RecommendationService;
  let movieService: MovieService;

  beforeEach(async () => {
    localStorage.clear();
    await TestBed.configureTestingModule({
      imports: [RecommendationsComponent],
      providers: [
        provideRouter([]),
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: PLATFORM_ID, useValue: 'browser' },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();

    recService = TestBed.inject(RecommendationService);
    movieService = TestBed.inject(MovieService);
    vi.spyOn(movieService, 'getGenres').mockReturnValue(of(['Drama', 'Action']));
  });

  const createFixture = () => {
    fixture = TestBed.createComponent(RecommendationsComponent);
    component = fixture.componentInstance;
  };

  afterEach(() => localStorage.clear());

  it('creates the component', () => {
    vi.spyOn(recService, 'getRecommendations').mockReturnValue(of(PAGE));
    createFixture();
    fixture.detectChanges();
    expect(component).toBeTruthy();
  });

  it('loads recommendations on init', () => {
    const spy = vi.spyOn(recService, 'getRecommendations').mockReturnValue(of(PAGE));
    createFixture();
    fixture.detectChanges();
    expect(spy).toHaveBeenCalledWith('', null, null, 0, 20);
  });

  it('populates movies signal from response', () => {
    vi.spyOn(recService, 'getRecommendations').mockReturnValue(of(PAGE));
    createFixture();
    fixture.detectChanges();
    expect(component.movies()).toHaveLength(1);
    expect(component.movies()[0].title).toBe('Rec Movie');
  });

  it('hasLoaded becomes true after response', () => {
    vi.spyOn(recService, 'getRecommendations').mockReturnValue(of(EMPTY));
    createFixture();
    fixture.detectChanges();
    expect(component.hasLoaded()).toBe(true);
  });

  it('movies is empty when API returns no results', () => {
    vi.spyOn(recService, 'getRecommendations').mockReturnValue(of(EMPTY));
    createFixture();
    fixture.detectChanges();
    expect(component.movies()).toHaveLength(0);
  });

  it('passes genre filter to service on filter change', () => {
    const spy = vi.spyOn(recService, 'getRecommendations').mockReturnValue(of(EMPTY));
    createFixture();
    fixture.detectChanges();
    component.genre.set('Drama');
    component.onFilterChange();
    expect(spy).toHaveBeenCalledWith('Drama', null, null, 0, 20);
  });

  it('passes yearFrom and yearTo filters to service', () => {
    const spy = vi.spyOn(recService, 'getRecommendations').mockReturnValue(of(EMPTY));
    createFixture();
    fixture.detectChanges();
    component.yearFrom.set(2010);
    component.yearTo.set(2020);
    component.onFilterChange();
    expect(spy).toHaveBeenCalledWith('', 2010, 2020, 0, 20);
  });

  it('clearFilters() resets genre, yearFrom, yearTo and reloads', () => {
    const spy = vi.spyOn(recService, 'getRecommendations').mockReturnValue(of(EMPTY));
    createFixture();
    fixture.detectChanges();
    component.genre.set('Action');
    component.yearFrom.set(2010);
    component.clearFilters();
    expect(component.genre()).toBe('');
    expect(component.yearFrom()).toBeNull();
    expect(spy).toHaveBeenLastCalledWith('', null, null, 0, 20);
  });

  it('sets movies to empty on error', () => {
    vi.spyOn(recService, 'getRecommendations').mockReturnValue(throwError(() => new Error('fail')));
    createFixture();
    fixture.detectChanges();
    expect(component.movies()).toHaveLength(0);
    expect(component.hasLoaded()).toBe(true);
  });
});