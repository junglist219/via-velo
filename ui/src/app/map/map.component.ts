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
import type { ParsedRoute, Stage } from './models';
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

    // Redraw layers whenever the route, the stage plan, or the selection change.
    effect(() => {
      this.route();
      this.stages();
      this.selectedStageIndex();
      if (this.map) this.render();
    });

    // Zoom depends only on the route and the selection — NOT on the stage plan,
    // so reflowing the split (which keeps the selection cleared) never re-zooms.
    effect(() => {
      this.route();
      this.selectedStageIndex();
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
  }

  private updateZoom(): void {
    if (!this.map) return;

    const route = this.route();
    if (!route || route.trackPoints.length < 2) return;

    const points = route.trackPoints;
    const selected = this.selectedStageIndex();
    // Read the stage plan without tracking it, so reflows do not trigger a zoom.
    const stage = selected !== null ? untracked(() => this.stages())[selected] : undefined;

    if (stage) {
      const segment = points
        .slice(stage.startPointIndex, stage.endPointIndex + 1)
        .map((pt) => L.latLng(pt.lat, pt.lng));
      this.map.fitBounds(L.latLngBounds(segment), { padding: [32, 32] });
    } else {
      const allLatLngs = points.map((pt) => L.latLng(pt.lat, pt.lng));
      this.map.fitBounds(L.latLngBounds(allLatLngs), { padding: [32, 32] });
    }
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
