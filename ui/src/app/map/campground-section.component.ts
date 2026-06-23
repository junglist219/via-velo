import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import type { Campground, CampStopView } from './models';

@Component({
  selector: 'app-campground-section',
  standalone: true,
  templateUrl: './campground-section.component.html',
  styleUrl: './campground-section.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CampgroundSectionComponent {
  readonly stop = input.required<CampStopView>();

  // Emits the stop's stageIndex when the user retries a failed search.
  readonly retry = output<number>();

  mapsUrl(camp: Campground): string {
    return `https://www.google.com/maps/search/?api=1&query=${camp.lat},${camp.lng}`;
  }

  onRetry(): void {
    this.retry.emit(this.stop().stageIndex);
  }
}
