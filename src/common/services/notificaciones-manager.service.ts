import { Injectable } from '@nestjs/common';
import { NotificacionesService } from '../../notificaciones/notificacion.service';
import { TipoNotificacion, NivelNotificacion } from '../../notificaciones/entities/notificacion.entity';

/**
 * Servicio común para la gestión de notificaciones del sistema
 * Proporciona métodos para crear notificaciones automáticas basadas en eventos del sistema
 */
@Injectable()
export class NotificacionesManagerService {
  constructor(private readonly notificacionesService: NotificacionesService) {}

  /**
   * Verifica si se debe crear una notificación de stock bajo
   * @param materialId ID del material
   * @param sitioId ID del sitio
   * @param stockActual Stock actual del material
   * @param stockMinimo Stock mínimo recomendado (por defecto 5)
   * @returns true si se creó la notificación, false en caso contrario
   */
  async verificarStockBajo(
    materialId: number, 
    sitioId: number, 
    stockActual: number, 
    stockMinimo: number = 5,
    areaId?: number
  ): Promise<boolean> {
    if (stockActual <= stockMinimo) {
      await this.notificacionesService.crearNotificacionStockBajo(
        materialId, 
        sitioId, 
        stockActual, 
        stockMinimo,
        areaId
      );
      return true;
    }
    return false;
  }

  /**
   * Crea una notificación de préstamo
   * @param materialId ID del material
   * @param sitioId ID del sitio
   * @param cantidad Cantidad prestada
   * @param areaId ID del área asociada al préstamo
   */
  async alertarPrestamo(
    materialId: number, 
    sitioId: number, 
    cantidad: number, 
    areaId: number
  ): Promise<void> {
    await this.notificacionesService.crearNotificacionPrestamo(
      materialId, 
      sitioId, 
      cantidad, 
      areaId
    );
  }

  /**
   * Crea una notificación de devolución
   * @param materialId ID del material
   * @param sitioId ID del sitio
   * @param cantidad Cantidad devuelta
   * @param areaId ID del área asociada a la devolución
   */
  async alertarDevolucion(
    materialId: number, 
    sitioId: number, 
    cantidad: number, 
    areaId: number
  ): Promise<void> {
    await this.notificacionesService.crearNotificacionDevolucion(
      materialId, 
      sitioId, 
      cantidad, 
      areaId
    );
  }

  /**
   * Crea una notificación de transferencia
   * @param materialId ID del material
   * @param sitioOrigenId ID del sitio origen
   * @param sitioDestinoId ID del sitio destino
   * @param cantidad Cantidad transferida
   * @param areaId ID del área asociada a la transferencia
   */
  async alertarTransferencia(
    materialId: number, 
    sitioOrigenId: number, 
    sitioDestinoId: number, 
    cantidad: number, 
    areaId: number
  ): Promise<void> {
    await this.notificacionesService.crearNotificacionTransferencia(
      materialId, 
      sitioOrigenId, 
      sitioDestinoId, 
      cantidad, 
      areaId
    );
  }

  /**
   * Crea una notificación de material nuevo
   * @param materialId ID del material
   * @param sitioId ID del sitio
   * @param cantidad Cantidad inicial
   * @param areaId ID del área asociada al registro del material
   */
  async alertarMaterialNuevo(
    materialId: number, 
    sitioId: number, 
    cantidad: number, 
    areaId: number
  ): Promise<void> {
    await this.notificacionesService.crearNotificacionMaterialNuevo(
      materialId, 
      sitioId, 
      cantidad, 
      areaId
    );
  }

  /**
   * Crea una notificación de movimiento crítico
   * @param materialId ID del material
   * @param sitioId ID del sitio
   * @param tipoMovimiento Tipo de movimiento
   * @param cantidad Cantidad del movimiento
   * @param areaId ID del área asociada al movimiento
   */
  async alertarMovimientoCritico(
    materialId: number, 
    sitioId: number, 
    tipoMovimiento: string, 
    cantidad: number, 
    areaId: number
  ): Promise<void> {
    await this.notificacionesService.crearNotificacionMovimientoCritico(
      materialId, 
      sitioId, 
      tipoMovimiento, 
      cantidad, 
      areaId
    );
  }

  /**
   * Crea una notificación del sistema
   * @param titulo Título de la notificación
   * @param mensaje Mensaje de la notificación
   * @param nivel Nivel de la notificación (info, warning, error, critical)
   */
  async alertarSistema(
    titulo: string, 
    mensaje: string, 
    nivel: NivelNotificacion = NivelNotificacion.INFO
  ): Promise<void> {
    await this.notificacionesService.crearNotificacionSistema(titulo, mensaje, nivel);
  }

  /**
   * Crea una notificación personalizada
   * @param tipo Tipo de notificación
   * @param titulo Título de la notificación
   * @param mensaje Mensaje de la notificación
   * @param nivel Nivel de la notificación
   * @param datosAdicionales Datos adicionales
   * @param materialId ID del material (opcional)
   * @param sitioId ID del sitio (opcional)
   * @param areaId ID del área (opcional)
   */
  async crearNotificacionPersonalizada(
    tipo: TipoNotificacion,
    titulo: string,
    mensaje: string,
    nivel: NivelNotificacion = NivelNotificacion.INFO,
    datosAdicionales?: any,
    materialId?: number,
    sitioId?: number,
    areaId?: number
  ): Promise<void> {
    await this.notificacionesService.create({
      tipo,
      nivel,
      titulo,
      mensaje,
      datos_adicionales: datosAdicionales,
      material_id: materialId,
      sitio_id: sitioId,
      area_id: areaId
    });
  }

  /**
   * Verifica y crea notificaciones automáticas basadas en el stock
   * @param materialId ID del material
   * @param sitioId ID del sitio
   * @param stockActual Stock actual
   * @param stockAnterior Stock anterior (para comparar)
   * @param stockMinimo Stock mínimo
   * @param areaId ID del área asociada (opcional)
   */
  async verificarAlertasStock(
    materialId: number,
    sitioId: number,
    stockActual: number,
    stockAnterior: number,
    stockMinimo: number = 5,
    areaId?: number
  ): Promise<void> {
    // Verificar si el stock está bajo
    await this.verificarStockBajo(materialId, sitioId, stockActual, stockMinimo, areaId);

    // Si el stock se agotó completamente, crear notificación crítica
    if (stockActual === 0 && stockAnterior > 0) {
      await this.alertarSistema(
        'Stock Agotado',
        `El material ${materialId} en el sitio ${sitioId} se ha agotado completamente`,
        NivelNotificacion.ERROR
      );
    }

    // Si el stock se redujo significativamente, crear notificación de advertencia
    if (stockActual < stockAnterior && stockActual <= stockMinimo * 2) {
      await this.alertarSistema(
        'Reducción Significativa de Stock',
        `El stock del material ${materialId} en el sitio ${sitioId} se ha reducido significativamente. Stock actual: ${stockActual}`,
        NivelNotificacion.WARNING
      );
    }
  }
}