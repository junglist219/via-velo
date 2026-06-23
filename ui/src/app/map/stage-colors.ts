/**
 * High-contrast palette shared by the map and the stage list so that the same
 * stage is drawn in the same color in both places. Colors are presentation only
 * and are derived from a stage's 0-based index at render time.
 */
export const STAGE_COLORS: string[] = [
  '#e6194b', // red
  '#3cb44b', // green
  '#4363d8', // blue
  '#f58231', // orange
  '#911eb4', // purple
  '#42d4f4', // cyan
  '#f032e6', // magenta
  '#9a6324', // brown
];

export function stageColor(index: number): string {
  return STAGE_COLORS[index % STAGE_COLORS.length];
}
