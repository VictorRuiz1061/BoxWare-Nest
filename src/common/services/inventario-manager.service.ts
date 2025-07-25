import { Injectable, BadRequestException } from '@nestjs/common';
import { InventarioService } from '../../inventario/inventario.service';

/**
 * Servicio común para la gestión de inventario
 * Proporciona métodos para actualizar el stock de materiales en diferentes situaciones
 */
@Injectable()
export class InventarioManagerService {
  constructor(private readonly inventarioService: InventarioService) {}

  /**
   * Actualiza el stock de un material en un sitio específico
   * @param materialId ID del material
   * @param sitioId ID del sitio
   * @param cantidad Cantidad a añadir (positiva) o restar (negativa)
   * @param placaSena Placa SENA del material (opcional)
   * @param descripcion Descripción adicional (opcional)
   * @returns true si la operación fue exitosa, false en caso contrario
   */
  async actualizarStock(
    materialId: number, 
    sitioId: number, 
    cantidad: number, 
    placaSena?: string, 
    descripcion?: string
  ): Promise<boolean> {
    try {
      await this.inventarioService.actualizarStock(materialId, sitioId, cantidad);
      return true;
    } catch (error) {
      console.error(`Error al actualizar el inventario: ${error.message}`);
      return false;
    }
  }

  /**
   * Registra una nueva característica de material en el inventario
   * @param materialId ID del material
   * @param sitioId ID del sitio
   * @returns true si la operación fue exitosa, false en caso contrario
   */
  async registrarNuevaCaracteristica(materialId: number, sitioId: number): Promise<boolean> {
    // Cada característica representa 1 unidad en el inventario
    return this.actualizarStock(materialId, sitioId, 1);
  }

  /**
   * Registra un préstamo de material en el inventario
   * @param materialId ID del material
   * @param sitioId ID del sitio
   * @param cantidad Cantidad prestada
   * @returns true si la operación fue exitosa, false en caso contrario
   */
  async registrarPrestamo(materialId: number, sitioId: number, cantidad: number): Promise<boolean> {
    // Validar stock suficiente antes de prestar
    const inventario = await this.inventarioService.findByMaterialAndSitio(materialId, sitioId);
    if (!inventario || inventario.stock < cantidad) {
      throw new BadRequestException(`Stock insuficiente en el sitio ${sitioId}. Stock actual: ${inventario?.stock ?? 0}, Cantidad solicitada: ${cantidad}`);
    }
    // Un préstamo disminuye el stock
    return this.actualizarStock(materialId, sitioId, -cantidad);
  }

  /**
   * Transfiere material de un sitio a otro
   * @param materialId ID del material
   * @param sitioOrigenId ID del sitio origen
   * @param sitioDestinoId ID del sitio destino
   * @param cantidad Cantidad a transferir
   * @returns true si la operación fue exitosa, false en caso contrario
   */
  async transferirMaterial(materialId: number, sitioOrigenId: number, sitioDestinoId: number, cantidad: number): Promise<boolean> {
    // Validar stock en el sitio origen
    const inventarioOrigen = await this.inventarioService.findByMaterialAndSitio(materialId, sitioOrigenId);
    if (!inventarioOrigen || inventarioOrigen.stock < cantidad) {
      throw new BadRequestException(`Stock insuficiente en el sitio origen. Stock actual: ${inventarioOrigen?.stock ?? 0}, Cantidad a transferir: ${cantidad}`);
    }
    // Restar del origen
    await this.actualizarStock(materialId, sitioOrigenId, -cantidad);
    // Sumar al destino (crea inventario si no existe)
    await this.actualizarStock(materialId, sitioDestinoId, cantidad);
    return true;
  }

  /**
   * Registra una devolución de material en el inventario
   * @param materialId ID del material
   * @param sitioId ID del sitio
   * @param cantidad Cantidad devuelta
   * @returns true si la operación fue exitosa, false en caso contrario
   */
  async registrarDevolucion(materialId: number, sitioId: number, cantidad: number): Promise<boolean> {
    // Una devolución aumenta el stock
    return this.actualizarStock(materialId, sitioId, cantidad);
  }
}
