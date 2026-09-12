import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'dateOnly',
  standalone: true,
})
export class DateOnlyPipe implements PipeTransform {
  transform(value: string | Date | null | undefined): string {
    if (!value) return '—';

    if (typeof value === 'string') {
      // Date-only / ISO date: use the calendar date exactly as received.
      const match = value.match(/^(\d{4})-(\d{2})-(\d{2})/);

      if (match) {
        return `${match[3]}-${match[2]}-${match[1]}`;
      }
    }

    if (value instanceof Date) {
      const day = String(value.getDate()).padStart(2, '0');
      const month = String(value.getMonth() + 1).padStart(2, '0');
      const year = value.getFullYear();

      return `${day}-${month}-${year}`;
    }

    return '—';
  }
}