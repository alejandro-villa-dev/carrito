/**
 * Componente Barra de Tabs Principal
 * Barra inferior con navegación entre tabs: Historial, Compra (central) y Ajustes
 *
 * @author DemWolf
 * @version 2.0 - Botón central integrado a la barra, con estado de compra en curso
 */

import { Component, Input, Output, EventEmitter } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-tab-barra-principal',
  templateUrl: './tab-barra-principal.component.html',
  styleUrls: ['./tab-barra-principal.component.scss']
})
export class TabBarraPrincipalComponent {

  @Input() tabActivo: string = 'nueva-compra';
  /** Hay una compra en curso: el botón central pasa de "+" a carrito con contador */
  @Input() compraActiva: boolean = false;
  @Input() cantidadProductos: number = 0;
  @Output() cambioTab = new EventEmitter<string>();

  constructor(private router: Router) {}

  /**
   * Navegar a un tab específico
   */
  async navegarATab(tab: string): Promise<void> {
    this.tabActivo = tab;
    this.cambioTab.emit(tab);

    try {
      await this.router.navigateByUrl(`/pantalla-principal/${tab}`);
    } catch (error) {
      console.error('❌ Error al navegar al tab:', tab, error);
    }
  }
}
