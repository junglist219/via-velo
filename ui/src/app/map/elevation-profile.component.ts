import { Component, input, computed } from '@angular/core';
import { BaseChartDirective } from 'ng2-charts';
import type { ChartConfiguration } from 'chart.js';
import type { Stage, TrackPoint } from './models';
import { buildElevationChartData } from './elevation-chart-data';

@Component({
  selector: 'app-elevation-profile',
  standalone: true,
  imports: [BaseChartDirective],
  templateUrl: './elevation-profile.component.html',
  styleUrl: './elevation-profile.component.scss',
})
export class ElevationProfileComponent {
  readonly trackPoints = input<TrackPoint[]>([]);
  readonly stages = input<Stage[]>([]);
  readonly selectedStageIndex = input<number | null>(null);

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

  readonly chartData = computed((): ChartConfiguration['data'] =>
    buildElevationChartData(this.trackPoints(), this.stages(), this.selectedStageIndex()),
  );
}
