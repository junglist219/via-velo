import { Pipe, PipeTransform } from '@angular/core';

/**
 * Formats a duration in minutes as a human-readable hours/minutes string:
 * `"2h 5m"` for combined values, `"2h"` for whole hours, `"45 min"` when under
 * an hour, and `"0 min"` for zero. Input is rounded to the nearest minute.
 */
@Pipe({ name: 'duration', standalone: true })
export class DurationPipe implements PipeTransform {
  transform(minutes: number): string {
    const total = Math.round(minutes);
    if (total <= 0) return '0 min';

    const hours = Math.floor(total / 60);
    const mins = total % 60;

    if (hours === 0) return `${mins} min`;
    if (mins === 0) return `${hours}h`;
    return `${hours}h ${mins}m`;
  }
}
