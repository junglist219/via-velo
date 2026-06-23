import { Component, input, computed } from '@angular/core';
import { BaseChartDirective } from 'ng2-charts';
import type { ChartConfiguration } from 'chart.js';
import type { TrackPoint } from './models';

@Component({
  selector: 'app-elevation-profile',
  standalone: true,
  imports: [BaseChartDirective],
  template: `
    @if (trackPoints().length > 0) {
      <div class="elevation-strip">
        <canvas
          baseChart
          [type]="chartType"
          [data]="chartData()"
          [options]="chartOptions"
        ></canvas>
      </div>
    }
  `,
  styles: [`
    .elevation-strip {
      height: 150px;
      width: 100%;
      background: #fff;
      border-top: 1px solid #e5e7eb;
      padding: 0.25rem 0.5rem 0.25rem;
      box-sizing: border-box;
    }
  `],
})
export class ElevationProfileComponent {
  readonly trackPoints = input<TrackPoint[]>([]);

  readonly chartType: ChartConfiguration['type'] = 'line';

  readonly chartOptions: ChartConfiguration['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
    },
    elements: {
      point: { radius: 0 },
      line: { tension: 0.3 },
    },
    scales: {
      x: {
        title: { display: true, text: 'Distanz (km)' },
        ticks: {
          maxTicksLimit: 10,
        },
      },
      y: {
        title: { display: true, text: 'Höhe (m)' },
      },
    },
  };

  readonly chartData = computed((): ChartConfiguration['data'] => {
    const pts = this.trackPoints();
    return {
      labels: pts.map(p => p.distanceFromStart.toFixed(1)),
      datasets: [
        {
          data: pts.map(p => p.elevation),
          borderColor: '#3B82F6',
          backgroundColor: 'rgba(59,130,246,0.15)',
          fill: true,
          pointRadius: 0,
          tension: 0.3,
        },
      ],
    };
  });
}
