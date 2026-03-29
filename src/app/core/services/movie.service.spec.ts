import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { MovieService, Movie, PagedResponse } from './movie.service';

const MOVIE: Movie = {
  id: 'm1', title: 'Test Movie', genres: ['Action'], releaseYear: 2020,
  description: 'A test', posterUrl: null, averageRating: 4.0, createdAt: '2024-01-01',
};

const PAGE: PagedResponse<Movie> = { content: [MOVIE], page: 0, size: 20, totalElements: 1, totalPages: 1 };

describe('MovieService', () => {
  let service: MovieService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(MovieService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('getMovies() sends GET to /api/movies', () => {
    service.getMovies(0, 20).subscribe();
    const req = http.expectOne((r) => r.url === '/api/movies');
    expect(req.request.method).toBe('GET');
    expect(req.request.params.get('page')).toBe('0');
    expect(req.request.params.get('size')).toBe('20');
    req.flush(PAGE);
  });

  it('getMovies() returns cached result on second call', () => {
    let count = 0;
    service.getMovies(0, 20).subscribe(() => count++);
    http.expectOne((r) => r.url === '/api/movies').flush(PAGE);

    service.getMovies(0, 20).subscribe(() => count++);
    http.expectNone('/api/movies');
    expect(count).toBe(2);
  });

  it('getMovieById() sends GET to /api/movies/:id', () => {
    service.getMovieById('m1').subscribe();
    const req = http.expectOne('/api/movies/m1');
    expect(req.request.method).toBe('GET');
    req.flush(MOVIE);
  });

  it('getMovieById() returns cached result on second call', () => {
    let count = 0;
    service.getMovieById('m1').subscribe(() => count++);
    http.expectOne('/api/movies/m1').flush(MOVIE);

    service.getMovieById('m1').subscribe(() => count++);
    http.expectNone('/api/movies/m1');
    expect(count).toBe(2);
  });

  it('searchMovies() sends GET to /api/movies/search with params', () => {
    service.searchMovies('Inception', 'Action', 2010, 2020).subscribe();
    const req = http.expectOne((r) => r.url === '/api/movies/search');
    expect(req.request.params.get('title')).toBe('Inception');
    expect(req.request.params.get('genre')).toBe('Action');
    expect(req.request.params.get('releaseYearFrom')).toBe('2010');
    expect(req.request.params.get('releaseYearTo')).toBe('2020');
    req.flush(PAGE);
  });

  it('searchMovies() omits null year params', () => {
    service.searchMovies('', '', null, null).subscribe();
    const req = http.expectOne((r) => r.url === '/api/movies/search');
    expect(req.request.params.has('releaseYearFrom')).toBe(false);
    expect(req.request.params.has('releaseYearTo')).toBe(false);
    req.flush(PAGE);
  });

  it('getGenres() sends GET to /api/movies/genres', () => {
    service.getGenres().subscribe();
    const req = http.expectOne('/api/movies/genres');
    expect(req.request.method).toBe('GET');
    req.flush(['Action', 'Drama']);
  });

  it('getGenres() returns cached result on second call', () => {
    let count = 0;
    service.getGenres().subscribe(() => count++);
    http.expectOne('/api/movies/genres').flush(['Action']);

    service.getGenres().subscribe(() => count++);
    http.expectNone('/api/movies/genres');
    expect(count).toBe(2);
  });
});