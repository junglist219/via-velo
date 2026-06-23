import { ChangeDetectionStrategy, Component, computed, inject, input, model } from '@angular/core';
import { StagePlannerService } from './stage-planner.service';
import type { ParsedRoute } from './models';

@Component({
  selector: 'app-stage-planner',
  standalone: true,
  templateUrl: './stage-planner.component.html',
  styleUrl: './stage-planner.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StagePlannerComponent {
  private readonly planner = inject(StagePlannerService);

  readonly route = input<ParsedRoute | null>(null);

  // Single source of truth for the coupling; both km controls and the days
  // field are derived from and feed back into this value.
  readonly numberOfStages = model<number>(1);

  readonly minKm = 30;
  readonly maxKm = 150;

  readonly maxStages = computed(() => {
    const r = this.route();
    return r ? Math.max(1, r.trackPoints.length - 1) : 1;
  });

  // The originally suggested day count is a pure function of the route, so it
  // stays stable while the user adjusts the split.
  readonly suggestedDays = computed(() => {
    const r = this.route();
    return r ? this.planner.suggestDays(r) : 0;
  });

  // Displayed stage length snaps to a value that corresponds to whole days.
  readonly displayedKm = computed(() => {
    const r = this.route();
    const n = this.numberOfStages();
    if (!r || n < 1) return 0;
    return Math.round(r.totalDistanceKm / n);
  });

  onKmInput(value: string): void {
    const km = Number(value);
    const r = this.route();
    if (!r || !Number.isFinite(km) || km <= 0) return;
    const clampedKm = this.clamp(km, this.minKm, this.maxKm);
    const n = this.clamp(Math.round(r.totalDistanceKm / clampedKm), 1, this.maxStages());
    this.numberOfStages.set(n);
  }

  onDaysInput(value: string): void {
    const days = Number(value);
    if (!Number.isFinite(days)) return;
    const n = this.clamp(Math.round(days), 1, this.maxStages());
    this.numberOfStages.set(n);
  }

  private clamp(value: number, min: number, max: number): number {
    return Math.min(Math.max(value, min), max);
  }
}
