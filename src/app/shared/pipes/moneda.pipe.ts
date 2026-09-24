import { Pipe, PipeTransform } from '@angular/core';

import { MonedaService } from '../../core/services/moneda.service';

/**
 * Muestra un monto con el formato de moneda del país del usuario.
 * Uso: {{ total | moneda }}
 *
 * Es impuro a propósito: si el usuario cambia de país, los montos visibles se actualizan.
 * El costo es mínimo (un Intl.NumberFormat ya creado y pocas decenas de valores en pantalla).
 */
@Pipe({
  name: 'moneda',
  pure: false
})
export class MonedaPipe implements PipeTransform {

  constructor(private monedaService: MonedaService) {}

  transform(valor: number | null | undefined): string {
    return this.monedaService.formatear(valor);
  }
}
