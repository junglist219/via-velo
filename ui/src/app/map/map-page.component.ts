import { Component, computed, effect, inject, signal } from '@angular/core';
import { MapComponent } from './map.component';
import { GpxImportComponent } from './gpx-import.component';
import { RouteInfoComponent } from './route-info.component';
import { ElevationProfileComponent } from './elevation-profile.component';
import { StageListComponent } from './stage-list.component';
import { StagePlannerComponent } from './stage-planner.component';
import { StepIndicatorComponent } from './step-indicator.component';
import { GpxParserService } from './gpx-parser.service';
import { StagePlannerService } from './stage-planner.service';
import type { ParsedRoute } from './models';

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
  ],
  templateUrl: './map-page.component.html',
  styleUrl: './map-page.component.scss',
})
export class MapPageComponent {
  private readonly gpxParser = inject(GpxParserService);
  private readonly planner = inject(StagePlannerService);

  route = signal<ParsedRoute | null>(null);
  errorMessage = signal<string | null>(null);

  // Single source of truth for the day-count coupling.
  numberOfStages = signal(1);
  selectedStageIndex = signal<number | null>(null);

  stages = computed(() => {
    const r = this.route();
    return r ? this.planner.planStages(r, this.numberOfStages()) : [];
  });

  // Planning-flow position: 1 = Import (no route yet), 2 = Etappen (route loaded).
  currentStep = computed(() => (this.route() ? 2 : 1));

  constructor() {
    // Reflowing the split always returns to the overview; clear any selection.
    effect(() => {
      this.numberOfStages();
      this.selectedStageIndex.set(null);
    });
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
