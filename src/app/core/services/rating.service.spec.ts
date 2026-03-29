import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { RatingService, RatingResponse } from './rating.service';

const RATING: RatingResponse = { id: 'r1', userId: 'u1', movieId: 'm1', score: 4, ratedAt: '2024-01-01T00:00:00' };

describe('RatingService', () => {
  let service: RatingService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(RatingService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('getByMovie() sends GET to /api/ratings/movie/:movieId', () => {
    service.getByMovie('m1').subscribe();
    const req = http.expectOne('/api/ratings/movie/m1');
    expect(req.request.method).toBe('GET');
    req.flush([RATING]);
  });

  it('create() sends POST to /api/ratings with movieId and score', () => {
    service.create('m1', 4).subscribe();
    const req = http.expectOne('/api/ratings');
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({ movieId: 'm1', score: 4 });
    req.flush(RATING);
  });

  it('update() sends PUT to /api/ratings/:id with score', () => {
    service.update('r1', 5).subscribe();
    const req = http.expectOne('/api/ratings/r1');
    expect(req.request.method).toBe('PUT');
    expect(req.request.body).toBe(5);
    req.flush({ ...RATING, score: 5 });
  });

  it('delete() sends DELETE to /api/ratings/:id', () => {
    service.delete('r1').subscribe();
    const req = http.expectOne('/api/ratings/r1');
    expect(req.request.method).toBe('DELETE');
    req.flush(null);
  });
});