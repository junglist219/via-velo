import { ChangeDetectionStrategy, Component, computed, input, model, output } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { DurationPipe } from './duration.pipe';
import { CampgroundSectionComponent } from './campground-section.component';
import { stageColor } from './stage-colors';
import type { CampStopView, Stage } from './models';

@Component({
  selector: 'app-stage-list',
  standalone: true,
  imports: [DurationPipe, DecimalPipe, CampgroundSectionComponent],
  templateUrl: './stage-list.component.html',
  styleUrl: './stage-list.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StageListComponent {
  readonly stages = input<Stage[]>([]);
  readonly campStops = input<CampStopView[]>([]);
  readonly selectedIndex = model<number | null>(null);
  readonly expandedIndex = model<number | null>(null);

  // Retry of a failed stop's campground search, bubbled to the page.
  readonly retry = output<number>();

  readonly canPrev = computed(() => this.stages().length > 0 && this.selectedIndex() !== 0);
  readonly canNext = computed(
    () => this.stages().length > 0 && this.selectedIndex() !== this.stages().length - 1,
  );

  // Quick lookup of a stage's campground state by its stageIndex.
  readonly campStopByIndex = computed(() => {
    const map = new Map<number, CampStopView>();
    for (const stop of this.campStops()) map.set(stop.stageIndex, stop);
    return map;
  });

  stageColor(index: number): string {
    return stageColor(index);
  }

  // Intermediate stages (every stage except the last) own an overnight stopover
  // and therefore an expander.
  isIntermediate(index: number): boolean {
    return index < this.stages().length - 1;
  }

  campStopFor(index: number): CampStopView | undefined {
    return this.campStopByIndex().get(index);
  }

  select(index: number): void {
    this.selectedIndex.set(index);
  }

  toggleExpand(index: number, event: Event): void {
    // The chevron lives inside the row body; keep the two actions distinct.
    event.stopPropagation();
    this.expandedIndex.set(this.expandedIndex() === index ? null : index);
  }

  onRetry(stageIndex: number): void {
    this.retry.emit(stageIndex);
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
