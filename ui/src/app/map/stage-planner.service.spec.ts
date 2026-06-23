import { TestBed } from '@angular/core/testing';
import { StagePlannerService } from './stage-planner.service';
import type { ParsedRoute, TrackPoint } from './models';

/**
 * Build a route of `segments + 1` points evenly spaced over `totalKm`, with the
 * elevation at each point produced by `elevationAt(i)`.
 */
function buildRoute(totalKm: number, segments: number, elevationAt: (i: number) => number): ParsedRoute {
  const points: TrackPoint[] = [];
  for (let i = 0; i <= segments; i++) {
    points.push({
      lat: 46 + i * 0.001,
      lng: 8 + i * 0.001,
      elevation: elevationAt(i),
      distanceFromStart: (totalKm * i) / segments,
    });
  }
  let gain = 0;
  let loss = 0;
  for (let i = 1; i < points.length; i++) {
    const delta = points[i].elevation - points[i - 1].elevation;
    if (delta > 0) gain += delta;
    else loss += -delta;
  }
  return {
    trackPoints: points,
    totalDistanceKm: totalKm,
    elevationGainM: gain,
    elevationLossM: loss,
  };
}

// Flat ~300 km route, no climbing.
const flatRoute = buildRoute(300, 300, () => 0);

// Mountainous ~300 km route: climbing is concentrated in the first half
// (~6000 m), the second half is flat. Effort-balanced stages therefore cover
// unequal distances, which distance-only splitting would not produce.
const mountainRoute = buildRoute(300, 300, (i) => Math.min(i, 150) * 40);

function effortKm(stage: { distanceKm: number; elevationGainM: number }): number {
  return stage.distanceKm + stage.elevationGainM / 100;
}

describe('StagePlannerService', () => {
  let service: StagePlannerService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(StagePlannerService);
  });

  it('returns exactly N non-empty stages for valid N', () => {
    for (const n of [1, 2, 3, 5, 7]) {
      const stages = service.planStages(flatRoute, n);
      expect(stages.length).toBe(n);
      for (const s of stages) {
        expect(s.endPointIndex).toBeGreaterThan(s.startPointIndex);
        expect(s.distanceKm).toBeGreaterThan(0);
      }
    }
  });

  it('chains stage boundaries so they cover the whole route contiguously', () => {
    const stages = service.planStages(flatRoute, 4);
    expect(stages[0].startPointIndex).toBe(0);
    expect(stages[stages.length - 1].endPointIndex).toBe(flatRoute.trackPoints.length - 1);
    for (let k = 1; k < stages.length; k++) {
      expect(stages[k].startPointIndex).toBe(stages[k - 1].endPointIndex);
    }
  });

  it('returns [] for a route with fewer than two points', () => {
    const single = buildRoute(0, 0, () => 0); // 1 point
    expect(single.trackPoints.length).toBe(1);
    expect(service.planStages(single, 3)).toEqual([]);
    expect(service.suggestDays(single)).toBe(0);
  });

  it('re-clamps N to [1, trackPoints.length - 1]', () => {
    const tiny = buildRoute(10, 3, () => 0); // 4 points -> max 3 stages
    expect(service.planStages(tiny, 0).length).toBe(1);
    expect(service.planStages(tiny, -5).length).toBe(1);
    expect(service.planStages(tiny, 99).length).toBe(3);
  });

  it('sums stage distances to the route total within tolerance', () => {
    const stages = service.planStages(mountainRoute, 4);
    const sum = stages.reduce((acc, s) => acc + s.distanceKm, 0);
    expect(Math.abs(sum - mountainRoute.totalDistanceKm)).toBeLessThan(0.01);
  });

  it('balances stages by effort, not merely by distance', () => {
    const stages = service.planStages(mountainRoute, 4);
    const efforts = stages.map(effortKm);
    const mean = efforts.reduce((a, b) => a + b, 0) / efforts.length;
    for (const e of efforts) {
      expect(Math.abs(e - mean) / mean).toBeLessThan(0.1);
    }
    // The sawtooth profile makes distances differ even though effort is balanced.
    const distances = stages.map((s) => s.distanceKm);
    const maxDist = Math.max(...distances);
    const minDist = Math.min(...distances);
    expect(maxDist - minDist).toBeGreaterThan(0);
  });

  it('suggests fewer days for a flat route than a mountainous route of comparable distance', () => {
    const flatDays = service.suggestDays(flatRoute);
    const mountainDays = service.suggestDays(mountainRoute);
    expect(flatDays).toBeLessThan(mountainDays);
  });

  it('suggests ~3 days for a flat ~300 km route, landing stages in the 60-100 km band', () => {
    const days = service.suggestDays(flatRoute);
    expect(days).toBe(3);
    const stages = service.planStages(flatRoute, days);
    for (const s of stages) {
      expect(s.distanceKm).toBeGreaterThanOrEqual(60);
      expect(s.distanceKm).toBeLessThanOrEqual(100);
    }
  });

  it('estimates duration from distance and climbing', () => {
    // 18 km flat at 18 km/h = 60 min.
    expect(service.estimateDurationMinutes(18, 0)).toBeCloseTo(60);
    // 1800 m of climb adds 18 effort-km = another 60 min.
    expect(service.estimateDurationMinutes(18, 1800)).toBeCloseTo(120);
  });
});
