import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import {
  HttpTestingController,
  provideHttpClientTesting,
} from '@angular/common/http/testing';
import { CampgroundService } from './campground.service';

const OVERPASS_ENDPOINT = 'https://overpass-api.de/api/interpreter';

describe('CampgroundService', () => {
  let service: CampgroundService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(CampgroundService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('settles at 5 km with a single request when a campground is within 5 km', async () => {
    const promise = service.findNear(46.5, 8.0);

    const req = httpMock.expectOne(OVERPASS_ENDPOINT);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toContain('around:5000');
    req.flush({
      elements: [
        { id: 1, lat: 46.51, lon: 8.01, tags: { name: 'Camping Alpenblick' } },
      ],
    });

    const result = await promise;
    expect(result.radiusKm).toBe(5);
    expect(result.expanded).toBe(false);
    expect(result.campgrounds.length).toBe(1);
    expect(result.campgrounds[0].name).toBe('Camping Alpenblick');
  });

  // Each radius is awaited before the next request is issued, so the test must
  // yield to the microtask queue between flushes for the next POST to appear.
  const tick = () => new Promise((resolve) => setTimeout(resolve, 0));

  it('escalates to 20 km when nothing is found nearer and flags it expanded', async () => {
    const promise = service.findNear(46.5, 8.0);

    const req5 = httpMock.expectOne(OVERPASS_ENDPOINT);
    expect(req5.request.body).toContain('around:5000');
    req5.flush({ elements: [] });
    await tick();

    const req10 = httpMock.expectOne(OVERPASS_ENDPOINT);
    expect(req10.request.body).toContain('around:10000');
    req10.flush({ elements: [] });
    await tick();

    const req20 = httpMock.expectOne(OVERPASS_ENDPOINT);
    expect(req20.request.body).toContain('around:20000');
    req20.flush({
      elements: [{ id: 2, lat: 46.7, lon: 8.3, tags: { name: 'Far Camp' } }],
    });

    const result = await promise;
    expect(result.radiusKm).toBe(20);
    expect(result.expanded).toBe(true);
    expect(result.campgrounds.length).toBe(1);
  });

  it('settles at 30 km with an empty, expanded result when nothing is found anywhere', async () => {
    const promise = service.findNear(46.5, 8.0);

    for (const r of [5000, 10000, 20000, 30000]) {
      const req = httpMock.expectOne(OVERPASS_ENDPOINT);
      expect(req.request.body).toContain(`around:${r}`);
      req.flush({ elements: [] });
      await tick();
    }

    const result = await promise;
    expect(result.radiusKm).toBe(30);
    expect(result.expanded).toBe(true);
    expect(result.campgrounds.length).toBe(0);
  });

  it('maps a node element via lat/lon', async () => {
    const promise = service.findNear(46.5, 8.0);
    httpMock.expectOne(OVERPASS_ENDPOINT).flush({
      elements: [{ id: 7, lat: 46.7, lon: 8.3, tags: { name: 'Node Camp' } }],
    });

    const { campgrounds } = await promise;
    expect(campgrounds[0].lat).toBe(46.7);
    expect(campgrounds[0].lng).toBe(8.3);
  });

  it('maps a way element via center.lat/center.lon', async () => {
    const promise = service.findNear(46.5, 8.0);
    httpMock.expectOne(OVERPASS_ENDPOINT).flush({
      elements: [
        { id: 8, center: { lat: 47.1, lon: 9.2 }, tags: { name: 'Way Camp' } },
      ],
    });

    const { campgrounds } = await promise;
    expect(campgrounds[0].lat).toBe(47.1);
    expect(campgrounds[0].lng).toBe(9.2);
  });

  it('falls back to "Campingplatz" when no name tag is present', async () => {
    const promise = service.findNear(46.5, 8.0);
    httpMock.expectOne(OVERPASS_ENDPOINT).flush({
      elements: [{ id: 9, lat: 46.5, lon: 8.0, tags: {} }],
    });

    const { campgrounds } = await promise;
    expect(campgrounds[0].name).toBe('Campingplatz');
  });

  it('falls back to contact:website when website is absent', async () => {
    const promise = service.findNear(46.5, 8.0);
    httpMock.expectOne(OVERPASS_ENDPOINT).flush({
      elements: [
        {
          id: 10,
          lat: 46.5,
          lon: 8.0,
          tags: { 'contact:website': 'https://example.com' },
        },
      ],
    });

    const { campgrounds } = await promise;
    expect(campgrounds[0].website).toBe('https://example.com');
  });

  it('assembles an address from addr:* tags', async () => {
    const promise = service.findNear(46.5, 8.0);
    httpMock.expectOne(OVERPASS_ENDPOINT).flush({
      elements: [
        {
          id: 11,
          lat: 46.5,
          lon: 8.0,
          tags: {
            'addr:street': 'Seestrasse',
            'addr:housenumber': '12',
            'addr:postcode': '3800',
            'addr:city': 'Interlaken',
          },
        },
      ],
    });

    const { campgrounds } = await promise;
    expect(campgrounds[0].address).toBe('Seestrasse 12, 3800 Interlaken');
  });

  it('returns a null address when no addr:* tags are present', async () => {
    const promise = service.findNear(46.5, 8.0);
    httpMock.expectOne(OVERPASS_ENDPOINT).flush({
      elements: [{ id: 12, lat: 46.5, lon: 8.0, tags: { name: 'No Address' } }],
    });

    const { campgrounds } = await promise;
    expect(campgrounds[0].address).toBeNull();
  });
});
