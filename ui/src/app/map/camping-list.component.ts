import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { stageColor } from './stage-colors';
import type { CampStopView } from './models';

@Component({
  selector: 'app-camping-list',
  standalone: true,
  templateUrl: './camping-list.component.html',
  styleUrl: './camping-list.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CampingListComponent {
  readonly stops = input<CampStopView[]>([]);
  readonly selectedStageIndex = input<number | null>(null);
  readonly search = output<number>();
  readonly stopFocused = output<number>();

  stageColor(index: number): string {
    return stageColor(index);
  }

  onSearch(stageIndex: number): void {
    this.search.emit(stageIndex);
  }

  onFocus(stageIndex: number): void {
    this.stopFocused.emit(stageIndex);
  }
}
