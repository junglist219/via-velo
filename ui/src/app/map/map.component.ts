import {
  Component,
  ElementRef,
  OnDestroy,
  effect,
  input,
  output,
  untracked,
  viewChild,
  afterNextRender,
} from '@angular/core';
import * as L from 'leaflet';
import type { Campground, CampStop, ParsedRoute, Stage } from './models';
import { stageColor } from './stage-colors';

const DIMMED_OPACITY = 0.3;

@Component({
  selector: 'app-map',
  templateUrl: './map.component.html',
  styleUrl: './map.component.scss',
})
export class MapComponent implements OnDestroy {
  readonly route = input<ParsedRoute | null>(null);
  readonly stages = input<Stage[]>([]);
  readonly selectedStageIndex = input<number | null>(null);
  readonly campStops = input<CampStop[]>([]);
  readonly expandedStageIndex = input<number | null>(null);
  readonly stageSelected = output<number>();

  private readonly mapContainerRef = viewChild.required<ElementRef<HTMLDivElement>>('mapContainer');
  protected map?: L.Map;
  private routeLayer?: L.LayerGroup;

  constructor() {
    afterNextRender(() => {
      this.initMap();
      this.render();
      this.updateZoom();
    });

    // Redraw layers whenever the route, the stage plan, the selection, or the
    // campground results change.
    effect(() => {
      this.route();
      this.stages();
      this.selectedStageIndex();
      this.campStops();
      this.expandedStageIndex();
      if (this.map) this.render();
    });

    // Zoom depends only on the route and the selections — NOT on the stage plan,
    // so reflowing the split (which keeps the selection cleared) never re-zooms.
    effect(() => {
      this.route();
      this.selectedStageIndex();
      this.expandedStageIndex();
      if (this.map) this.updateZoom();
    });
  }

  private initMap(): void {
    this.map = L.map(this.mapContainerRef().nativeElement).setView([46.8, 8.2], 8);
    L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
      subdomains: 'abcd',
      maxZoom: 20,
    }).addTo(this.map);
    this.routeLayer = L.layerGroup().addTo(this.map);
  }

  private render(): void {
    if (!this.map || !this.routeLayer) return;

    this.routeLayer.clearLayers();

    const route = this.route();
    if (!route || route.trackPoints.length < 2) return;

    const points = route.trackPoints;
    const allLatLngs = points.map((pt) => L.latLng(pt.lat, pt.lng));
    const stages = this.stages();
    const selected = this.selectedStageIndex();

    if (stages.length === 0) {
      // Fallback: single polyline when no stage plan is available.
      L.polyline(allLatLngs, { color: '#3B82F6', weight: 4 }).addTo(this.routeLayer);
    } else {
      for (const stage of stages) {
        const segment = allLatLngs.slice(stage.startPointIndex, stage.endPointIndex + 1);
        const isSelected = selected === stage.index;
        const dim = selected !== null && !isSelected;
        L.polyline(segment, {
          color: stageColor(stage.index),
          weight: isSelected ? 7 : 4,
          opacity: dim ? DIMMED_OPACITY : 1,
        })
          .on('click', () => this.stageSelected.emit(stage.index))
          .addTo(this.routeLayer);
        this.addStageStartMarker(stage, points[stage.startPointIndex], dim);
      }
    }

    const first = points[0];
    const last = points[points.length - 1];

    // Green start / red end cues are retained.
    L.circleMarker([first.lat, first.lng], {
      radius: 8,
      fillColor: '#16a34a',
      color: '#fff',
      weight: 2,
      fillOpacity: 1,
    }).addTo(this.routeLayer);

    L.circleMarker([last.lat, last.lng], {
      radius: 8,
      fillColor: '#ef4444',
      color: '#fff',
      weight: 2,
      fillOpacity: 1,
    }).addTo(this.routeLayer);

    const expanded = this.expandedStageIndex();
    for (const stop of this.campStops()) {
      const dim = expanded !== null && stop.stageIndex !== expanded;
      this.addCampStop(stop, dim);
    }
  }

  private addCampStop(stop: CampStop, dim: boolean): void {
    if (!this.routeLayer) return;
    const color = stageColor(stop.stageIndex);

    L.circle([stop.lat, stop.lng], {
      radius: stop.radiusKm * 1000,
      color,
      weight: 1,
      fillColor: color,
      fillOpacity: dim ? 0.08 * DIMMED_OPACITY : 0.08,
      opacity: dim ? 0.4 * DIMMED_OPACITY : 0.4,
    }).addTo(this.routeLayer);

    for (const camp of stop.campgrounds) {
      const icon = L.divIcon({
        className: 'campground-marker',
        html: `<span class="campground-marker__badge" style="background:${color};opacity:${
          dim ? DIMMED_OPACITY : 1
        }">⛺</span>`,
        iconSize: [22, 22],
        iconAnchor: [11, 11],
      });
      L.marker([camp.lat, camp.lng], { icon })
        .bindPopup(this.buildCampgroundPopup(camp), { maxWidth: 260 })
        .addTo(this.routeLayer);
    }
  }

  private buildCampgroundPopup(camp: Campground): string {
    const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${camp.lat},${camp.lng}`;
    const parts = [`<strong>${this.escapeHtml(camp.name)}</strong>`];
    if (camp.address) {
      parts.push(`<span class="campground-popup__address">${this.escapeHtml(camp.address)}</span>`);
    }
    if (camp.website) {
      const href = this.escapeHtml(camp.website);
      parts.push(
        `<a class="campground-popup__link" href="${href}" target="_blank" rel="noopener">Webseite</a>`,
      );
    }
    parts.push(
      `<a class="campground-popup__link" href="${mapsUrl}" target="_blank" rel="noopener">Google Maps</a>`,
    );
    return `<div class="campground-popup">${parts.join('')}</div>`;
  }

  private escapeHtml(value: string): string {
    return value
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  private updateZoom(): void {
    if (!this.map) return;

    const route = this.route();
    if (!route || route.trackPoints.length < 2) return;

    const points = route.trackPoints;
    const selected = this.selectedStageIndex();
    const expanded = this.expandedStageIndex();
    // Read the stage plan without tracking it, so reflows do not trigger a zoom.
    const stage = selected !== null ? untracked(() => this.stages())[selected] : undefined;
    // Read the camp stops without tracking them, so a fresh result does not re-zoom.
    // The expanded stage's overnight location, when known, extends the focus.
    const campStop =
      expanded !== null
        ? untracked(() => this.campStops()).find((s) => s.stageIndex === expanded)
        : undefined;

    if (!stage) {
      // Nothing selected → whole-route overview.
      const allLatLngs = points.map((pt) => L.latLng(pt.lat, pt.lng));
      this.map.fitBounds(L.latLngBounds(allLatLngs), { padding: [32, 32] });
      return;
    }

    const segment = points
      .slice(stage.startPointIndex, stage.endPointIndex + 1)
      .map((pt) => L.latLng(pt.lat, pt.lng));
    const bounds = L.latLngBounds(segment);

    // Expanded stage with a known overnight location → fit segment + search circle.
    if (campStop) {
      bounds.extend(
        L.circle([campStop.lat, campStop.lng], { radius: campStop.radiusKm * 1000 }).getBounds(),
      );
    }

    this.map.fitBounds(bounds, { padding: [32, 32] });
  }

  private addStageStartMarker(
    stage: Stage,
    start: { lat: number; lng: number },
    dim: boolean,
  ): void {
    if (!this.routeLayer) return;
    const color = stageColor(stage.index);
    const icon = L.divIcon({
      className: 'stage-marker',
      html: `<span class="stage-marker__badge" style="background:${color};opacity:${
        dim ? DIMMED_OPACITY : 1
      }">${stage.index + 1}</span>`,
      iconSize: [22, 22],
      iconAnchor: [11, 11],
    });
    L.marker([start.lat, start.lng], { icon })
      .on('click', () => this.stageSelected.emit(stage.index))
      .addTo(this.routeLayer);
  }

  ngOnDestroy(): void {
    this.map?.remove();
  }
}
