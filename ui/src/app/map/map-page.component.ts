import { Component, inject, signal } from '@angular/core';
import { MapComponent } from './map.component';
import { GpxImportComponent } from './gpx-import.component';
import { RouteInfoComponent } from './route-info.component';
import { ElevationProfileComponent } from './elevation-profile.component';
import { GpxParserService } from './gpx-parser.service';
import type { ParsedRoute } from './models';

@Component({
  selector: 'app-map-page',
  imports: [MapComponent, GpxImportComponent, RouteInfoComponent, ElevationProfileComponent],
  templateUrl: './map-page.component.html',
  styleUrl: './map-page.component.scss',
})
export class MapPageComponent {
  private readonly gpxParser = inject(GpxParserService);

  route = signal<ParsedRoute | null>(null);
  errorMessage = signal<string | null>(null);

  async onFileSelected(file: File): Promise<void> {
    try {
      const parsed = await this.gpxParser.parse(file);
      this.route.set(parsed);
      this.errorMessage.set(null);
    } catch (err) {
      this.errorMessage.set(err instanceof Error ? err.message : 'Ungültige GPX-Datei.');
    }
  }
}
