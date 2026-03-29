import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { WatchlistService, WatchlistItem } from './watchlist.service';

const ITEMS: WatchlistItem[] = [
  { movieId: 'm1', addedAt: '2024-01-01T00:00:00' },
  { movieId: 'm2', addedAt: '2024-01-02T00:00:00' },
];

describe('WatchlistService', () => {
  let service: WatchlistService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(WatchlistService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('watchlistIds signal starts empty', () => {
    expect(service.watchlistIds().size).toBe(0);
  });

  it('load() sends GET and populates watchlistIds signal', () => {
    service.load().subscribe();
    http.expectOne('/api/users/profile/watchlist').flush(ITEMS);
    expect(service.watchlistIds().has('m1')).toBe(true);
    expect(service.watchlistIds().has('m2')).toBe(true);
  });

  it('loadOnce() fires one request; second call is a no-op', () => {
    service.loadOnce();
    http.expectOne('/api/users/profile/watchlist').flush(ITEMS);

    service.loadOnce();
    http.expectNone('/api/users/profile/watchlist');
  });

  it('add() sends POST and adds movieId to signal', () => {
    const item: WatchlistItem = { movieId: 'm3', addedAt: '2024-01-03T00:00:00' };
    service.add('m3').subscribe();
    http.expectOne('/api/users/profile/watchlist').flush(item);
    expect(service.watchlistIds().has('m3')).toBe(true);
  });

  it('remove() sends DELETE and removes movieId from signal', () => {
    // Pre-populate via load
    service.load().subscribe();
    http.expectOne('/api/users/profile/watchlist').flush(ITEMS);
    expect(service.watchlistIds().has('m1')).toBe(true);

    service.remove('m1').subscribe();
    http.expectOne('/api/users/profile/watchlist/m1').flush(null);
    expect(service.watchlistIds().has('m1')).toBe(false);
    expect(service.watchlistIds().has('m2')).toBe(true);
  });

  it('add() sends correct request body', () => {
    service.add('m5').subscribe();
    const req = http.expectOne('/api/users/profile/watchlist');
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({ movieId: 'm5' });
    req.flush({ movieId: 'm5', addedAt: '2024-01-01T00:00:00' });
  });
});