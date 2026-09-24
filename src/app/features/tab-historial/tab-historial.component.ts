import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AlertController, ToastController } from '@ionic/angular';
import { trigger, state, style, transition, animate } from '@angular/animations';

// Importar servicios y modelos
import { ComprasService } from '../../core/services/compras.service';
import { MonedaService } from '../../core/services/moneda.service';
import { SesionCompra } from '../../core/models/sesion-compra.model';

@Component({
  selector: 'app-tab-historial',
  templateUrl: './tab-historial.component.html',
  styleUrls: ['./tab-historial.component.scss'],
  animations: [
    trigger('expandCollapse', [
      transition(':enter', [
        style({ height: 0, opacity: 0, overflow: 'hidden' }),
        animate('300ms ease-out', style({ height: '*', opacity: 1 }))
      ]),
      transition(':leave', [
        style({ height: '*', opacity: 1, overflow: 'hidden' }),
        animate('300ms ease-in', style({ height: 0, opacity: 0 }))
      ])
    ])
  ]
})
export class TabHistorialComponent implements OnInit {

  sesionesCompletadas: SesionCompra[] = [];
  sesionesBorrador: SesionCompra[] = [];
  sesionesGuardadas: SesionCompra[] = [];
  cargando: boolean = false;

  // Control de acordeón - ID de sesión expandida
  sesionExpandida: string | null = null;

  // Búsqueda en el historial (lugar o producto)
  busqueda: string = '';

  constructor(
    private router: Router,
    private comprasService: ComprasService,
    private alertController: AlertController,
    private toastController: ToastController,
    private monedaService: MonedaService
  ) {}

  async ngOnInit(): Promise<void> {
    console.log('📊 Tab Historial inicializado');
    await this.cargarHistorial();
  }

  /**
   * Cargar historial de sesiones completadas y borradores
   */
  private async cargarHistorial(): Promise<void> {
    try {
      this.cargando = true;

      // Obtener todas las sesiones completadas
      this.sesionesCompletadas = await this.comprasService.obtenerSesionesCompletadas();

      // Obtener todas las sesiones en estado borrador
      this.sesionesBorrador = await this.comprasService.obtenerSesionesBorrador();
      this.sesionesGuardadas = await this.comprasService.obtenerSesionesGuardadas();

      console.log(`📋 Sesiones completadas cargadas: ${this.sesionesCompletadas.length}`);
      console.log(`📝 Borradores cargados: ${this.sesionesBorrador.length}`);
      console.log(`📌 Listas guardadas cargadas: ${this.sesionesGuardadas.length}`);

    } catch (error) {
      console.error('Error al cargar historial:', error);
      await this.mostrarToast('Error al cargar historial', 'danger');
    } finally {
      this.cargando = false;
    }
  }

  /**
   * Alternar expansión de acordeón
   */
  toggleAcordeon(sesionId: string): void {
    if (this.sesionExpandida === sesionId) {
      this.sesionExpandida = null; // Colapsar si ya está expandido
    } else {
      this.sesionExpandida = sesionId; // Expandir
    }
  }

  /**
   * Verificar si una sesión está expandida
   */
  estaExpandida(sesionId: string): boolean {
    return this.sesionExpandida === sesionId;
  }

  formatearVigencia(sesion: SesionCompra): string {
    const restante = this.comprasService.obtenerTiempoRestanteBorrador(sesion);
    if (restante === null) return '';

    const segundos = Math.ceil(restante / 1000);
    const horasTotales = Math.floor(segundos / 3600);
    const minutos = Math.floor(segundos / 60);

    if (horasTotales >= 25) return 'Vigencia: 2 días';
    if (horasTotales >= 12) return 'Vigencia: 1 día';
    if (horasTotales >= 1) return `Vigencia: ${horasTotales} ${horasTotales === 1 ? 'hora' : 'horas'}`;
    if (minutos > 0) return `Vigencia: ${minutos} ${minutos === 1 ? 'minuto' : 'minutos'}`;
    return `Vigencia: ${segundos} ${segundos === 1 ? 'segundo' : 'segundos'}`;
  }

  /**
   * Días de calendario desde la compra (0 = hoy, 1 = ayer)
   */
  diasDesdeCompra(fecha: Date): number {
    const inicioDia = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
    const diferencia = inicioDia(new Date()) - inicioDia(new Date(fecha));
    return Math.round(diferencia / (1000 * 60 * 60 * 24));
  }

  /**
   * Formatear fecha para mostrar (según el país del usuario)
   */
  formatearFecha(fecha: Date): string {
    return this.monedaService.formatearFecha(fecha);
  }

  /**
   * Compras completadas filtradas por la búsqueda (lugar o nombre de producto)
   */
  get comprasFiltradas(): SesionCompra[] {
    const termino = this.busqueda.trim().toLowerCase();
    if (!termino) return this.sesionesCompletadas;

    return this.sesionesCompletadas.filter(sesion =>
      sesion.nombreSupermercado.toLowerCase().includes(termino) ||
      sesion.productos.some(producto => producto.nombre.toLowerCase().includes(termino))
    );
  }

  /**
   * Resumen del mes en curso: cuántas compras y cuánto se gastó
   */
  get resumenMes(): { compras: number; total: number } {
    const ahora = new Date();
    const delMes = this.sesionesCompletadas.filter(sesion => {
      const fecha = new Date(sesion.fechaInicio);
      return fecha.getMonth() === ahora.getMonth() && fecha.getFullYear() === ahora.getFullYear();
    });

    return {
      compras: delMes.length,
      total: delMes.reduce((suma, sesion) => suma + (sesion.totales?.total || 0), 0)
    };
  }

  get nombreMesActual(): string {
    const nombre = new Date().toLocaleDateString(this.monedaService.locale, { month: 'long', year: 'numeric' });
    return nombre.charAt(0).toUpperCase() + nombre.slice(1);
  }

  get hayHistorial(): boolean {
    return this.sesionesCompletadas.length + this.sesionesBorrador.length + this.sesionesGuardadas.length > 0;
  }

  irANuevaCompra(): void {
    void this.router.navigateByUrl('/pantalla-principal/nueva-compra');
  }

  /**
   * Obtener producto con mayor cantidad de una sesión
   */
  obtenerProductoConMayorCantidad(sesion: SesionCompra): any {
    if (!sesion.productos || sesion.productos.length === 0) {
      return null;
    }
    return sesion.productos.reduce((max, producto) =>
      producto.cantidad > max.cantidad ? producto : max
    );
  }

  /**
   * Mostrar toast
   */
  private async mostrarToast(message: string, color: string = 'medium'): Promise<void> {
    const toast = await this.toastController.create({
      message,
      duration: 2000,
      color,
      position: 'top'
    });
    await toast.present();
  }

  /**
   * TrackBy function para optimizar renderizado
   */
  trackBySesion(index: number, sesion: SesionCompra): string {
    return sesion.id;
  }

  /**
   * TrackBy function para productos
   */
  trackByProducto(index: number, producto: any): string {
    return producto.id;
  }

  /**
   * Continuar un borrador: lo activa y abre la pantalla de compra para completar precios y cantidades
   */
  async editarBorrador(sesionId: string): Promise<void> {
    try {
      const borrador = this.sesionesBorrador.find(s => s.id === sesionId);
      if (!borrador) {
        await this.mostrarToast('No se encontró la lista', 'danger');
        return;
      }

      const activado = await this.comprasService.activarBorrador(sesionId);

      if (activado) {
        await this.router.navigateByUrl('/pantalla-principal/nueva-compra');
      } else {
        await this.mostrarToast('No se pudo abrir la lista. ¿Ya tienes otra compra en curso?', 'danger');
      }
    } catch (error) {
      console.error('Error al abrir el borrador:', error);
      await this.mostrarToast('Error al abrir la lista', 'danger');
    }
  }

  /**
   * Eliminar una lista en progreso
   */
  async eliminarBorrador(sesionId: string): Promise<void> {
    try {
      const borrador = this.sesionesBorrador.find(s => s.id === sesionId);
      if (!borrador) {
        await this.mostrarToast('No se encontró la lista', 'danger');
        return;
      }

      const alert = await this.alertController.create({
        header: '¿Eliminar Lista?',
        message: `¿Deseas eliminar la lista de "${borrador.nombreSupermercado}"?\n\nEsta acción no se puede deshacer.`,
        buttons: [
          {
            text: 'Cancelar',
            role: 'cancel'
          },
          {
            text: 'Eliminar',
            role: 'destructive',
            handler: async () => {
              const eliminado = await this.comprasService.eliminarSesion(sesionId);

              if (eliminado) {
                // Recargar borradores
                this.sesionesBorrador = await this.comprasService.obtenerSesionesBorrador();
                await this.mostrarToast('Lista eliminada', 'success');
              } else {
                await this.mostrarToast('Error al eliminar la lista', 'danger');
              }
            }
          }
        ]
      });

      await alert.present();

    } catch (error) {
      console.error('Error al eliminar la lista:', error);
      await this.mostrarToast('Error al eliminar la lista', 'danger');
    }
  }

}
