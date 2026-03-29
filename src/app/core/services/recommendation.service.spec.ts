import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { RecommendationService, PagedRecommendations } from './recommendation.service';

const EMPTY_PAGE: PagedRecommendations = { content: [], page: 0, size: 20, totalElements: 0, totalPages: 0 };

describe('RecommendationService', () => {
  let service: RecommendationService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(RecommendationService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('getRecommendations() sends GET to /api/recommendations', () => {
    service.getRecommendations('', null, null).subscribe();
    const req = http.expectOne((r) => r.url === '/api/recommendations');
    expect(req.request.method).toBe('GET');
    req.flush(EMPTY_PAGE);
  });

  it('includes page and size params', () => {
    service.getRecommendations('', null, null, 2, 10).subscribe();
    const req = http.expectOne((r) => r.url === '/api/recommendations');
    expect(req.request.params.get('page')).toBe('2');
    expect(req.request.params.get('size')).toBe('10');
    req.flush(EMPTY_PAGE);
  });

  it('includes genre param when provided', () => {
    service.getRecommendations('Action', null, null).subscribe();
    const req = http.expectOne((r) => r.url === '/api/recommendations');
    expect(req.request.params.get('genre')).toBe('Action');
    req.flush(EMPTY_PAGE);
  });

  it('omits genre param when empty string', () => {
    service.getRecommendations('', null, null).subscribe();
    const req = http.expectOne((r) => r.url === '/api/recommendations');
    expect(req.request.params.has('genre')).toBe(false);
    req.flush(EMPTY_PAGE);
  });

  it('includes yearFrom and yearTo when provided', () => {
    service.getRecommendations('', 2010, 2020).subscribe();
    const req = http.expectOne((r) => r.url === '/api/recommendations');
    expect(req.request.params.get('yearFrom')).toBe('2010');
    expect(req.request.params.get('yearTo')).toBe('2020');
    req.flush(EMPTY_PAGE);
  });

  it('omits yearFrom and yearTo when null', () => {
    service.getRecommendations('', null, null).subscribe();
    const req = http.expectOne((r) => r.url === '/api/recommendations');
    expect(req.request.params.has('yearFrom')).toBe(false);
    expect(req.request.params.has('yearTo')).toBe(false);
    req.flush(EMPTY_PAGE);
  });
});