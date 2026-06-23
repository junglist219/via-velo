import {
  Component,
  ElementRef,
  Input,
  OnChanges,
  OnDestroy,
  SimpleChanges,
  ViewChild,
  afterNextRender,
} from '@angular/core';
import * as L from 'leaflet';
import type { ParsedRoute } from './models';

@Component({
  selector: 'app-map',
  templateUrl: './map.component.html',
  styleUrl: './map.component.scss',
})
export class MapComponent implements OnChanges, OnDestroy {
  @Input() route: ParsedRoute | null = null;

  @ViewChild('mapContainer') private mapContainerRef!: ElementRef<HTMLDivElement>;
  protected map?: L.Map;
  private routeLayer?: L.LayerGroup;

  constructor() {
    afterNextRender(() => {
      this.initMap();
      if (this.route) {
        this.renderRoute(this.route);
      }
    });
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['route'] && this.map) {
      this.renderRoute(this.route);
    }
  }

  private initMap(): void {
    this.map = L.map(this.mapContainerRef.nativeElement).setView([46.8, 8.2], 8);
    L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
      subdomains: 'abcd',
      maxZoom: 20,
    }).addTo(this.map);
    this.routeLayer = L.layerGroup().addTo(this.map);
  }

  private renderRoute(route: ParsedRoute | null): void {
    if (!this.map || !this.routeLayer) return;

    this.routeLayer.clearLayers();

    if (!route || route.trackPoints.length < 2) return;

    const latLngs = route.trackPoints.map((pt) => L.latLng(pt.lat, pt.lng));

    L.polyline(latLngs, { color: '#3B82F6', weight: 4 }).addTo(this.routeLayer);

    const first = route.trackPoints[0];
    const last = route.trackPoints[route.trackPoints.length - 1];

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

    this.map.fitBounds(L.latLngBounds(latLngs), { padding: [32, 32] });
  }

  ngOnDestroy(): void {
    this.map?.remove();
  }
}
