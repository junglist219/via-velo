import { Component, input } from '@angular/core';
import type { ParsedRoute } from './models';

@Component({
  selector: 'app-route-info',
  standalone: true,
  template: `
    <div class="route-info">
      <div class="metric">
        <span class="label">Distanz</span>
        <span class="value">{{ distanceText() }}</span>
      </div>
      <div class="metric">
        <span class="label">Aufstieg</span>
        <span class="value">{{ gainText() }}</span>
      </div>
      <div class="metric">
        <span class="label">Abstieg</span>
        <span class="value">{{ lossText() }}</span>
      </div>
    </div>
  `,
  styles: [`
    .route-info {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
      padding: 1rem 1.25rem;
    }

    .metric {
      display: flex;
      justify-content: space-between;
      align-items: baseline;
    }

    .label {
      font-size: 0.875rem;
      color: #6b7280;
    }

    .value {
      font-size: 0.9375rem;
      font-weight: 600;
      color: #111827;
    }
  `],
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
