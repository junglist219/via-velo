import { Component, input } from '@angular/core';
import type { ParsedRoute } from './models';

@Component({
  selector: 'app-route-info',
  standalone: true,
  templateUrl: './route-info.component.html',
  styleUrl: './route-info.component.scss',
})
export class RouteInfoComponent {
  readonly route = input<ParsedRoute | null>(null);

  distanceText(): string {
    const r = this.route();
    if (r === null) return '—';
    return `${r.totalDistanceKm.toFixed(1)} km`;
  }

  gainText(): string {
    const r = this.route();
    if (r === null) return '—';
    return `↑ ${Math.round(r.elevationGainM)} m`;
  }

  lossText(): string {
    const r = this.route();
    if (r === null) return '—';
    return `↓ ${Math.round(r.elevationLossM)} m`;
  }
}
