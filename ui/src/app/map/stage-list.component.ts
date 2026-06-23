import { ChangeDetectionStrategy, Component, computed, input, model } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { DurationPipe } from './duration.pipe';
import { stageColor } from './stage-colors';
import type { Stage } from './models';

@Component({
  selector: 'app-stage-list',
  standalone: true,
  imports: [DurationPipe, DecimalPipe],
  templateUrl: './stage-list.component.html',
  styleUrl: './stage-list.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StageListComponent {
  readonly stages = input<Stage[]>([]);
  readonly selectedIndex = model<number | null>(null);

  readonly canPrev = computed(() => this.stages().length > 0 && this.selectedIndex() !== 0);
  readonly canNext = computed(
    () => this.stages().length > 0 && this.selectedIndex() !== this.stages().length - 1,
  );

  stageColor(index: number): string {
    return stageColor(index);
  }

  select(index: number): void {
    this.selectedIndex.set(index);
  }

  prev(): void {
    if (!this.canPrev()) return;
    const current = this.selectedIndex();
    // From no selection, stepping back lands on the last stage.
    this.selectedIndex.set(current === null ? this.stages().length - 1 : current - 1);
  }

  next(): void {
    if (!this.canNext()) return;
    const current = this.selectedIndex();
    // From no selection, stepping forward lands on the first stage.
    this.selectedIndex.set(current === null ? 0 : current + 1);
  }
}
