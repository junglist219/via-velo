import type { ChartConfiguration } from 'chart.js';
import type { Stage, TrackPoint } from './models';
import { stageColor } from './stage-colors';

/**
 * Neutral color used for the elevation profile when no stage is selected and for
 * the non-selected portion of the profile when a stage is selected. Matches the
 * neutral route color used on the map.
 */
export const NEUTRAL_ELEVATION_COLOR = '#3B82F6';
const NEUTRAL_ELEVATION_FILL = 'rgba(59,130,246,0.15)';

/**
 * Builds the elevation chart dataset from the raw track points, the stage plan
 * and the currently selected stage index.
 *
 * This is a pure, deterministic function: for a given set of arguments it always
 * returns the same dataset and it reads no component or external state. The line
 * is drawn neutral everywhere except for the points within the selected stage's
 * `[startPointIndex, endPointIndex]` range, which are drawn in that stage's
 * shared-palette color via `stageColor`. When `selectedStageIndex` is `null`
 * (or out of range) the whole line is drawn in the single neutral color.
 */
export function buildElevationChartData(
  trackPoints: TrackPoint[],
  stages: Stage[],
  selectedStageIndex: number | null,
): ChartConfiguration['data'] {
  const labels = trackPoints.map((p) => p.distanceFromStart.toFixed(1));
  const data = trackPoints.map((p) => p.elevation);

  const selectedStage =
    selectedStageIndex !== null ? stages[selectedStageIndex] : undefined;

  // No selection (or an out-of-range index): a single neutral-color line.
  if (!selectedStage) {
    return {
      labels,
      datasets: [
        {
          data,
          borderColor: NEUTRAL_ELEVATION_COLOR,
          backgroundColor: NEUTRAL_ELEVATION_FILL,
          fill: true,
          pointRadius: 0,
          tension: 0.3,
        },
      ],
    };
  }

  const color = stageColor(selectedStageIndex as number);
  const start = selectedStage.startPointIndex;
  const end = selectedStage.endPointIndex;

  // A line segment between points p(i-1) and p(i) belongs to the selected stage
  // when its end point index falls inside the stage's inclusive range.
  const isSelectedSegment = (segmentEndIndex: number): boolean =>
    segmentEndIndex > start && segmentEndIndex <= end;

  return {
    labels,
    datasets: [
      {
        data,
        borderColor: NEUTRAL_ELEVATION_COLOR,
        backgroundColor: NEUTRAL_ELEVATION_FILL,
        fill: true,
        pointRadius: 0,
        tension: 0.3,
        segment: {
          borderColor: (ctx) =>
            isSelectedSegment(ctx.p1DataIndex) ? color : NEUTRAL_ELEVATION_COLOR,
        },
      },
    ],
  };
}
