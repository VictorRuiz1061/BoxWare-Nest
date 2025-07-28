import { Injectable } from '@nestjs/common';
import { AlertasService } from '../../alertas/alertas.service';
import { TipoAlerta, NivelAlerta } from '../../alertas/entities/alerta.entity';

/**
 * Servicio común para la gestión de alertas del sistema
 * Proporciona métodos para crear alertas automáticas basadas en eventos del sistema
 */
@Injectable()
export class AlertaManagerService {
  constructor(private readonly alertasService: AlertasService) {}

  /**
   * Verifica si se debe crear una alerta de stock bajo
   * @param materialId ID del material
   * @param sitioId ID del sitio
   * @param stockActual Stock actual del material
   * @param stockMinimo Stock mínimo recomendado (por defecto 5)
   * @returns true si se creó la alerta, false en caso contrario
   */
  async verificarStockBajo(
    materialId: number, 
    sitioId: number, 
    stockActual: number, 
    stockMinimo: number = 5
  ): Promise<boolean> {
    if (stockActual <= stockMinimo) {
      await this.alertasService.crearAlertaStockBajo(
        materialId, 
        sitioId, 
        stockActual, 
        stockMinimo
      );
      return true;
    }
    return false;
  }

  /**
   * Crea una alerta de préstamo
   * @param materialId ID del material
   * @param sitioId ID del sitio
   * @param cantidad Cantidad prestada
   * @param usuarioId ID del usuario que realiza el préstamo
   */
  async alertarPrestamo(
    materialId: number, 
    sitioId: number, 
    cantidad: number, 
    usuarioId: number
  ): Promise<void> {
    await this.alertasService.crearAlertaPrestamo(
      materialId, 
      sitioId, 
      cantidad, 
      usuarioId
    );
  }

  /**
   * Crea una alerta de devolución
   * @param materialId ID del material
   * @param sitioId ID del sitio
   * @param cantidad Cantidad devuelta
   * @param usuarioId ID del usuario que realiza la devolución
   */
  async alertarDevolucion(
    materialId: number, 
    sitioId: number, 
    cantidad: number, 
    usuarioId: number
  ): Promise<void> {
    await this.alertasService.crearAlertaDevolucion(
      materialId, 
      sitioId, 
      cantidad, 
      usuarioId
    );
  }

  /**
   * Crea una alerta de transferencia
   * @param materialId ID del material
   * @param sitioOrigenId ID del sitio origen
   * @param sitioDestinoId ID del sitio destino
   * @param cantidad Cantidad transferida
   * @param usuarioId ID del usuario que realiza la transferencia
   */
  async alertarTransferencia(
    materialId: number, 
    sitioOrigenId: number, 
    sitioDestinoId: number, 
    cantidad: number, 
    usuarioId: number
  ): Promise<void> {
    await this.alertasService.crearAlertaTransferencia(
      materialId, 
      sitioOrigenId, 
      sitioDestinoId, 
      cantidad, 
      usuarioId
    );
  }

  /**
   * Crea una alerta de material nuevo
   * @param materialId ID del material
   * @param sitioId ID del sitio
   * @param cantidad Cantidad inicial
   * @param usuarioId ID del usuario que registra el material
   */
  async alertarMaterialNuevo(
    materialId: number, 
    sitioId: number, 
    cantidad: number, 
    usuarioId: number
  ): Promise<void> {
    await this.alertasService.crearAlertaMaterialNuevo(
      materialId, 
      sitioId, 
      cantidad, 
      usuarioId
    );
  }

  /**
   * Crea una alerta de movimiento crítico
   * @param materialId ID del material
   * @param sitioId ID del sitio
   * @param tipoMovimiento Tipo de movimiento
   * @param cantidad Cantidad del movimiento
   * @param usuarioId ID del usuario que realiza el movimiento
   */
  async alertarMovimientoCritico(
    materialId: number, 
    sitioId: number, 
    tipoMovimiento: string, 
    cantidad: number, 
    usuarioId: number
  ): Promise<void> {
    await this.alertasService.crearAlertaMovimientoCritico(
      materialId, 
      sitioId, 
      tipoMovimiento, 
      cantidad, 
      usuarioId
    );
  }

  /**
   * Crea una alerta del sistema
   * @param titulo Título de la alerta
   * @param mensaje Mensaje de la alerta
   * @param nivel Nivel de la alerta (info, warning, error, critical)
   */
  async alertarSistema(
    titulo: string, 
    mensaje: string, 
    nivel: NivelAlerta = NivelAlerta.INFO
  ): Promise<void> {
    await this.alertasService.crearAlertaSistema(titulo, mensaje, nivel);
  }

  /**
   * Crea una alerta personalizada
   * @param tipo Tipo de alerta
   * @param titulo Título de la alerta
   * @param mensaje Mensaje de la alerta
   * @param nivel Nivel de la alerta
   * @param datosAdicionales Datos adicionales
   * @param materialId ID del material (opcional)
   * @param sitioId ID del sitio (opcional)
   * @param usuarioId ID del usuario (opcional)
   */
  async crearAlertaPersonalizada(
    tipo: TipoAlerta,
    titulo: string,
    mensaje: string,
    nivel: NivelAlerta = NivelAlerta.INFO,
    datosAdicionales?: any,
    materialId?: number,
    sitioId?: number,
    usuarioId?: number
  ): Promise<void> {
    await this.alertasService.create({
      tipo,
      nivel,
      titulo,
      mensaje,
      datos_adicionales: datosAdicionales,
      material_id: materialId,
      sitio_id: sitioId,
      usuario_id: usuarioId
    });
  }

  /**
   * Verifica y crea alertas automáticas basadas en el stock
   * @param materialId ID del material
   * @param sitioId ID del sitio
   * @param stockActual Stock actual
   * @param stockAnterior Stock anterior (para comparar)
   * @param stockMinimo Stock mínimo
   */
  async verificarAlertasStock(
    materialId: number,
    sitioId: number,
    stockActual: number,
    stockAnterior: number,
    stockMinimo: number = 5
  ): Promise<void> {
    // Verificar si el stock está bajo
    await this.verificarStockBajo(materialId, sitioId, stockActual, stockMinimo);

    // Si el stock se agotó completamente, crear alerta crítica
    if (stockActual === 0 && stockAnterior > 0) {
      await this.alertarSistema(
        'Stock Agotado',
        `El material ${materialId} en el sitio ${sitioId} se ha agotado completamente`,
        NivelAlerta.CRITICAL
      );
    }

    // Si el stock se redujo significativamente, crear alerta de advertencia
    if (stockActual < stockAnterior && stockActual <= stockMinimo * 2) {
      await this.alertarSistema(
        'Reducción Significativa de Stock',
        `El stock del material ${materialId} en el sitio ${sitioId} se ha reducido significativamente. Stock actual: ${stockActual}`,
        NivelAlerta.WARNING
      );
    }
  }
} 