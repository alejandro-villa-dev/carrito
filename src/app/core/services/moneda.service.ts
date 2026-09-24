/**
 * Servicio de formato de moneda según el país del usuario.
 * Se actualiza solo cuando el usuario cambia de país en Ajustes.
 *
 * - Separadores de miles/decimales según el locale del país (es-CL: 12.500 · en-US: 12,500)
 * - Símbolo definido en PAISES_SOPORTADOS ($, S/, Bs, ₲, €...)
 * - Decimales según la moneda: CLP y PYG sin decimales, el resto hasta 2 (solo si hacen falta)
 *
 * @author DemWolf
 * @version 1.0
 */

import { Injectable } from '@angular/core';

import { UsuarioService } from './usuario.service';
import { Pais, buscarPaisPorCodigo } from '../models/pais.model';

const PAIS_POR_DEFECTO = 'CL';
const LOCALE_POR_DEFECTO = 'es-ES';

const LOCALES_POR_PAIS: { [codigo: string]: string } = {
  AR: 'es-AR', BO: 'es-BO', CL: 'es-CL', CO: 'es-CO', CR: 'es-CR',
  CU: 'es-CU', EC: 'es-EC', SV: 'es-SV', ES: 'es-ES', GT: 'es-GT',
  HN: 'es-HN', MX: 'es-MX', NI: 'es-NI', PA: 'es-PA', PY: 'es-PY',
  PE: 'es-PE', DO: 'es-DO', UY: 'es-UY', VE: 'es-VE', US: 'en-US'
};

@Injectable({
  providedIn: 'root'
})
export class MonedaService {

  private pais: Pais = buscarPaisPorCodigo(PAIS_POR_DEFECTO)!;
  private formateadorNumero!: Intl.NumberFormat;
  private localeActual: string = LOCALE_POR_DEFECTO;

  constructor(private usuarioService: UsuarioService) {
    this.configurarPais(PAIS_POR_DEFECTO);

    this.usuarioService.usuario$.subscribe((usuario) => {
      if (usuario?.pais && usuario.pais !== this.pais.codigo) {
        this.configurarPais(usuario.pais);
      }
    });
  }

  /** Símbolo de la moneda del país actual ($, S/, Bs, €...) */
  get simbolo(): string {
    return this.pais.simboloMoneda;
  }

  /** Nombre del país actual (Chile, México...) */
  get nombrePais(): string {
    return this.pais.nombre;
  }

  /** Locale del país actual (es-CL, es-MX, en-US...) */
  get locale(): string {
    return this.localeActual;
  }

  /** Formatea un monto: 12500 → "$12.500" en Chile, "$12,500" en México */
  formatear(valor: number | null | undefined): string {
    let numero = Number(valor);
    if (!isFinite(numero)) numero = 0;

    const texto = this.formateadorNumero.format(Math.abs(numero));
    const simbolo = this.pais.simboloMoneda;
    // Símbolos de una letra o signo pegados ($12.500); los largos separados (US$ 12,50 · Bs 12,50)
    const separador = simbolo.length > 1 ? ' ' : '';

    return `${numero < 0 ? '-' : ''}${simbolo}${separador}${texto}`;
  }

  /** Fecha corta según el país: "04 sept 2026" */
  formatearFecha(fecha: Date | string): string {
    return new Date(fecha).toLocaleDateString(this.localeActual, {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  }

  private configurarPais(codigo: string): void {
    this.pais = buscarPaisPorCodigo(codigo) ?? buscarPaisPorCodigo(PAIS_POR_DEFECTO)!;
    this.localeActual = LOCALES_POR_PAIS[this.pais.codigo] ?? LOCALE_POR_DEFECTO;

    try {
      const decimalesMoneda = new Intl.NumberFormat(this.localeActual, {
        style: 'currency',
        currency: this.pais.moneda
      }).resolvedOptions().maximumFractionDigits ?? 2;

      this.formateadorNumero = new Intl.NumberFormat(this.localeActual, {
        minimumFractionDigits: 0,
        maximumFractionDigits: decimalesMoneda,
        useGrouping: 'always'
      } as unknown as Intl.NumberFormatOptions);
    } catch {
      this.localeActual = LOCALE_POR_DEFECTO;
      this.formateadorNumero = new Intl.NumberFormat(LOCALE_POR_DEFECTO, {
        minimumFractionDigits: 0,
        maximumFractionDigits: 2
      });
    }
  }
}
