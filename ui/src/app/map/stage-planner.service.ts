import { Injectable } from '@angular/core';
import type { ParsedRoute, Stage, TrackPoint } from './models';

// Tunable model constants.
// Climbing is converted to "effort kilometers": 100 m of ascent counts as
// CLIMB_PENALTY_KM_PER_100M extra km, so a mountainous day is split shorter than
// a flat one for the same target effort.
export const RIDING_SPEED_KMH = 18;
export const CLIMB_PENALTY_KM_PER_100M = 1;
export const EFFORT_PER_DAY_KM = 95;

@Injectable({ providedIn: 'root' })
export class StagePlannerService {
  /**
   * Propose a sensible number of day stages from both distance and climbing.
   * Clamped to a value that can actually be produced by the track points.
   */
  suggestDays(route: ParsedRoute): number {
    const points = route.trackPoints;
    if (points.length < 2) return 0;

    const maxStages = points.length - 1;
    const totalEffortKm = this.totalEffortKm(points);
    const proposed = Math.round(totalEffortKm / EFFORT_PER_DAY_KM);
    return this.clamp(proposed, 1, maxStages);
  }

  /**
   * Split the route into exactly `numberOfStages` non-empty, effort-balanced
   * stages. Returns [] for a route with fewer than two track points.
   */
  planStages(route: ParsedRoute, numberOfStages: number): Stage[] {
    const points = route.trackPoints;
    if (points.length < 2) return [];

    const maxStages = points.length - 1;
    const n = this.clamp(Math.round(numberOfStages), 1, maxStages);

    // Cumulative effort at each point (effort[0] === 0).
    const effort: number[] = new Array(points.length).fill(0);
    for (let i = 1; i < points.length; i++) {
      effort[i] = effort[i - 1] + this.segmentEffort(points[i - 1], points[i]);
    }
    const totalEffort = effort[points.length - 1];
    const targetEffort = totalEffort / n;

    // Determine the cut points (point indices) that end stages 1..n-1.
    // Each stage must contain at least one segment, so cut k cannot move past
    // the point that still leaves room for the remaining stages.
    const boundaries: number[] = [0];
    let pointIndex = 1;
    for (let k = 1; k < n; k++) {
      const minIndex = boundaries[k - 1] + 1; // at least one segment in stage k
      const maxIndex = points.length - 1 - (n - k); // leave a segment for each later stage
      if (pointIndex < minIndex) pointIndex = minIndex;
      while (pointIndex < maxIndex && effort[pointIndex] < k * targetEffort) {
        pointIndex++;
      }
      boundaries.push(pointIndex);
      pointIndex++;
    }
    boundaries.push(points.length - 1); // last stage ends at the final point

    const stages: Stage[] = [];
    for (let k = 0; k < n; k++) {
      const startPointIndex = boundaries[k];
      const endPointIndex = boundaries[k + 1];
      const slice = points.slice(startPointIndex, endPointIndex + 1);
      const distanceKm =
        points[endPointIndex].distanceFromStart - points[startPointIndex].distanceFromStart;
      const { gain, loss } = this.elevationDeltas(slice);
      stages.push({
        index: k,
        startPointIndex,
        endPointIndex,
        distanceKm,
        elevationGainM: gain,
        elevationLossM: loss,
        durationMinutes: this.estimateDurationMinutes(distanceKm, gain),
      });
    }
    return stages;
  }

  estimateDurationMinutes(distanceKm: number, gainM: number): number {
    const effortKm = distanceKm + (gainM / 100) * CLIMB_PENALTY_KM_PER_100M;
    return (effortKm / RIDING_SPEED_KMH) * 60;
  }

  private totalEffortKm(points: TrackPoint[]): number {
    let total = 0;
    for (let i = 1; i < points.length; i++) {
      total += this.segmentEffort(points[i - 1], points[i]);
    }
    return total;
  }

  private segmentEffort(from: TrackPoint, to: TrackPoint): number {
    const distance = to.distanceFromStart - from.distanceFromStart;
    const climb = Math.max(0, to.elevation - from.elevation);
    return distance + (climb / 100) * CLIMB_PENALTY_KM_PER_100M;
  }

  private elevationDeltas(slice: TrackPoint[]): { gain: number; loss: number } {
    let gain = 0;
    let loss = 0;
    for (let i = 1; i < slice.length; i++) {
      const delta = slice[i].elevation - slice[i - 1].elevation;
      if (delta > 0) gain += delta;
      else loss += -delta;
    }
    return { gain, loss };
  }

  private clamp(value: number, min: number, max: number): number {
    return Math.min(Math.max(value, min), max);
  }
}
