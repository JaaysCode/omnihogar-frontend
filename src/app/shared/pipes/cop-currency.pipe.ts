import { Pipe, PipeTransform } from '@angular/core';

// Colombian peso has no minor unit in everyday use — prices are always whole pesos
// (e.g. $ 900.000, $ 9.000.000), so this formats with 0 decimals and '.' as the
// thousands separator, matching `Intl.NumberFormat('es-CO', ...)` output exactly.
const COP_FORMATTER = new Intl.NumberFormat('es-CO', {
  style: 'currency',
  currency: 'COP',
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
});

@Pipe({ name: 'copCurrency', standalone: true })
export class CopCurrencyPipe implements PipeTransform {
  transform(value: number | null | undefined): string {
    if (value === null || value === undefined || Number.isNaN(value)) {
      return COP_FORMATTER.format(0);
    }
    return COP_FORMATTER.format(value);
  }
}
