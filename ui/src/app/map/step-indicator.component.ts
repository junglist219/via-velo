import { ChangeDetectionStrategy, Component, input } from '@angular/core';

interface PlanningStep {
  readonly number: number;
  readonly label: string;
}

const STEPS: readonly PlanningStep[] = [
  { number: 1, label: 'Import' },
  { number: 2, label: 'Etappen' },
  { number: 3, label: 'Camping' },
];

@Component({
  selector: 'app-step-indicator',
  standalone: true,
  templateUrl: './step-indicator.component.html',
  styleUrl: './step-indicator.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StepIndicatorComponent {
  readonly currentStep = input<number>(1);

  readonly steps = STEPS;
}
