import { Component, computed, effect, inject, signal } from '@angular/core';
import { MapComponent } from './map.component';
import { GpxImportComponent } from './gpx-import.component';
import { RouteInfoComponent } from './route-info.component';
import { ElevationProfileComponent } from './elevation-profile.component';
import { StageListComponent } from './stage-list.component';
import { StagePlannerComponent } from './stage-planner.component';
import { StepIndicatorComponent } from './step-indicator.component';
import { CampingListComponent } from './camping-list.component';
import { GpxParserService } from './gpx-parser.service';
import { StagePlannerService } from './stage-planner.service';
import { CampgroundService } from './campground.service';
import type { CampStop, CampStopView, ParsedRoute } from './models';

@Component({
  selector: 'app-map-page',
  imports: [
    MapComponent,
    GpxImportComponent,
    RouteInfoComponent,
    ElevationProfileComponent,
    StageListComponent,
    StagePlannerComponent,
    StepIndicatorComponent,
    CampingListComponent,
  ],
  templateUrl: './map-page.component.html',
  styleUrl: './map-page.component.scss',
})
export class MapPageComponent {
  private readonly gpxParser = inject(GpxParserService);
  private readonly planner = inject(StagePlannerService);
  private readonly campgrounds = inject(CampgroundService);

  route = signal<ParsedRoute | null>(null);
  errorMessage = signal<string | null>(null);

  // Single source of truth for the day-count coupling.
  numberOfStages = signal(1);
  selectedStageIndex = signal<number | null>(null);

  // Per-stopover campground state, keyed by the stop's stageIndex so each stop's
  // result, loading flag, and error stay independent.
  campStops = signal<Map<number, CampStop>>(new Map());
  campLoadingStops = signal<Set<number>>(new Set());
  campErrors = signal<Map<number, string>>(new Map());

  // Panel-driven focus on a single overnight stop. Mutually exclusive with the
  // stage selection — only one focus is ever active.
  selectedCampStopIndex = signal<number | null>(null);

  stages = computed(() => {
    const r = this.route();
    return r ? this.planner.planStages(r, this.numberOfStages()) : [];
  });

  // Intermediate stage ends only: the end of stage k for k = 0 … n-2. The final
  // stage's end is the route destination and is excluded. Non-empty only for >=2 stages.
  campStopCoordinates = computed<{ stageIndex: number; lat: number; lng: number }[]>(() => {
    const r = this.route();
    const stages = this.stages();
    if (!r || stages.length < 2) return [];
    return stages.slice(0, -1).map((stage) => {
      const pt = r.trackPoints[stage.endPointIndex];
      return { stageIndex: stage.index, lat: pt.lat, lng: pt.lng };
    });
  });

  // One row per intermediate stopover, joining the coordinates with each stop's
  // result / loading / error state.
  campStopViews = computed<CampStopView[]>(() => {
    const results = this.campStops();
    const loading = this.campLoadingStops();
    const errors = this.campErrors();
    return this.campStopCoordinates().map((coord) => ({
      stageIndex: coord.stageIndex,
      result: results.get(coord.stageIndex) ?? null,
      loading: loading.has(coord.stageIndex),
      error: errors.get(coord.stageIndex) ?? null,
    }));
  });

  // Flat ordered list of searched stops the map consumes, in stage order.
  campStopsList = computed<CampStop[]>(() => {
    const results = this.campStops();
    return this.campStopCoordinates()
      .map((coord) => results.get(coord.stageIndex))
      .filter((stop): stop is CampStop => stop !== undefined);
  });

  // Planning-flow position: 1 = Import (no route yet), 2 = Etappen (route loaded),
  // 3 = Camping (a stopover has been searched or is in flight).
  currentStep = computed(() =>
    this.route() ? (this.campStops().size || this.campLoadingStops().size ? 3 : 2) : 1,
  );

  constructor() {
    // Reflowing the split always returns to the overview; clear any selection and
    // wipe all campground results so stale overnight options are never shown.
    effect(() => {
      this.numberOfStages();
      this.selectedStageIndex.set(null);
      this.selectedCampStopIndex.set(null);
      this.campStops.set(new Map());
      this.campLoadingStops.set(new Set());
      this.campErrors.set(new Map());
    });

    // Selecting a stage clears any focused camp stop — only one focus is active.
    effect(() => {
      if (this.selectedStageIndex() !== null) {
        this.selectedCampStopIndex.set(null);
      }
    });
  }

  // Focusing a camp stop clears any selected stage (the inverse exclusion).
  onCampStopFocused(stageIndex: number): void {
    this.selectedStageIndex.set(null);
    this.selectedCampStopIndex.set(stageIndex);
  }

  async loadCampgroundsForStop(stageIndex: number): Promise<void> {
    // Ignore re-triggers while this stop's request is already in flight.
    if (this.campLoadingStops().has(stageIndex)) return;

    const coord = this.campStopCoordinates().find((c) => c.stageIndex === stageIndex);
    if (!coord) return;

    this.campLoadingStops.update((set) => new Set(set).add(stageIndex));
    try {
      const { campgrounds, radiusKm, expanded } = await this.campgrounds.findNear(
        coord.lat,
        coord.lng,
      );
      const stop: CampStop = {
        stageIndex,
        lat: coord.lat,
        lng: coord.lng,
        radiusKm,
        expanded,
        campgrounds,
      };
      this.campStops.update((map) => new Map(map).set(stageIndex, stop));
      this.campErrors.update((map) => {
        const next = new Map(map);
        next.delete(stageIndex);
        return next;
      });
    } catch {
      // Leave this stop's previous result intact; surface a per-stop error.
      this.campErrors.update((map) =>
        new Map(map).set(stageIndex, 'Suche fehlgeschlagen. Bitte erneut versuchen.'),
      );
    } finally {
      this.campLoadingStops.update((set) => {
        const next = new Set(set);
        next.delete(stageIndex);
        return next;
      });
    }
  }

  async onFileSelected(file: File): Promise<void> {
    try {
      const parsed = await this.gpxParser.parse(file);
      this.route.set(parsed);
      this.numberOfStages.set(this.planner.suggestDays(parsed));
      this.selectedStageIndex.set(null);
      this.errorMessage.set(null);
    } catch (err) {
      this.errorMessage.set(err instanceof Error ? err.message : 'Ungültige GPX-Datei.');
    }
  }
}
