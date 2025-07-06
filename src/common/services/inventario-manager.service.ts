import { Injectable, NotFoundException } from '@nestjs/common';
import { InventarioService } from '../../inventario/inventario.service';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Material } from 'src/materiales/entities/materiale.entity';
import { Inventario } from 'src/inventario/entities/inventario.entity';

/**
 * Servicio común para la gestión de inventario
 * Proporciona métodos para actualizar el stock de materiales en diferentes situaciones
 */
@Injectable()
export class InventarioManagerService {
  constructor(
    private readonly inventarioService: InventarioService,
    @InjectRepository(Material)
    private readonly materialRepo: Repository<Material>,
    @InjectRepository(Inventario)
    private readonly inventarioRepo: Repository<Inventario>
  ) {}

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
      // Verificar que el material existe
      const material = await this.materialRepo.findOne({
        where: { id_material: materialId }
      });
      if (!material) {
        throw new NotFoundException(`Material con ID ${materialId} no encontrado`);
      }
      // Buscar si ya existe un inventario para este material en este sitio
      let inventario = await this.inventarioRepo.findOne({
        where: { 
          sitio: { id_sitio: sitioId }
        },
        relations: ['sitio']
      });

      // Actualizar el stock en el inventario
      await this.inventarioService.actualizarStock(sitioId, cantidad);
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
    // Un préstamo disminuye el stock
    return this.actualizarStock(materialId, sitioId, -cantidad);
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
