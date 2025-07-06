import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Material } from './entities/materiale.entity';
import { CreateMaterialeDto } from './dto/create-materiale.dto';
import { UpdateMaterialeDto } from './dto/update-materiale.dto';
import { CategoriaElemento } from '../categoria-elementos/entities/categoria-elemento.entity';
import { TipoMaterial } from '../tipo-materiales/entities/tipo-materiale.entity';
import { InventarioManagerService } from '../common/services/inventario-manager.service';

@Injectable()
export class MaterialesService {
  constructor(
    @InjectRepository(Material)
    private readonly materialRepo: Repository<Material>,
    @InjectRepository(CategoriaElemento)
    private readonly categoriaRepo: Repository<CategoriaElemento>,
    @InjectRepository(TipoMaterial)
    private readonly tipoMaterialRepo: Repository<TipoMaterial>,
    private readonly inventarioManager: InventarioManagerService,
  ) {}

  async create(dto: CreateMaterialeDto): Promise<Material> {
    try {
      const { categoria_id, tipo_material_id, ...materialData } = dto;

      const nuevoMaterial = this.materialRepo.create(materialData);
      const materialGuardado = await this.materialRepo.save(nuevoMaterial);

      if (categoria_id) {
        await this.materialRepo.createQueryBuilder()
          .relation(Material, 'categoria_id') // ← nombre de la relación en la entidad
          .of(materialGuardado.id_material)
          .set(categoria_id);
      }

      if (tipo_material_id) {
        await this.materialRepo.createQueryBuilder()
          .relation(Material, 'tipo_material_id')
          .of(materialGuardado.id_material)
          .set(tipo_material_id);
      }

      return this.findOne(materialGuardado.id_material);
    } catch (error) {
      console.error('Error al crear material:', error);
      throw error;
    }
  }

  async findAll(): Promise<Material[]> {
    return this.materialRepo.find({
      relations: ['categoria_id', 'tipo_material_id', 'caracteristicas'],
    });
  }

  async findOne(id: number | string): Promise<Material> {
    const material = await this.materialRepo.findOne({
      where: { id_material: Number(id) },
      relations: ['categoria_id', 'tipo_material_id', 'caracteristicas'],
    });

    if (!material) {
      throw new NotFoundException(`Material con ID ${id} no encontrado`);
    }

    return material;
  }

  async update(id: number | string, dto: UpdateMaterialeDto): Promise<Material> {
    const material = await this.findOne(id);

    Object.assign(material, dto);

    return this.materialRepo.save(material);
  }

  async remove(id: number | string): Promise<boolean> {
    const result = await this.materialRepo.delete(id);
    return !!result.affected && result.affected > 0;
  }

  /**
   * Actualiza el stock de un material específico
   * @param materialId ID del material
   * @param sitioId ID del sitio
   * @param cantidad Cantidad a añadir o restar
   * @param placaSena Placa SENA (si aplica)
   * @param descripcion Descripción (si aplica)
   * @returns Objeto con el resultado de la operación
   */
  async actualizarStockMaterial(
    materialId: number, 
    sitioId: number, 
    cantidad: number,
    placaSena?: string,
    descripcion?: string
  ): Promise<{ success: boolean; message: string }> {
    try {
      // Verificamos que el material exista
      const material = await this.findOne(materialId);
      if (!material) {
        throw new NotFoundException(`Material con ID ${materialId} no encontrado`);
      }

      // Llamamos al servicio de inventario para actualizar el stock
      await this.inventarioManager.actualizarStock(
        materialId, 
        sitioId, 
        cantidad, 
        placaSena, 
        descripcion
      );

      return {
        success: true,
        message: `Stock del material ${material.nombre_material} actualizado correctamente`
      };
    } catch (error) {
      throw new BadRequestException(
        `Error al actualizar el stock: ${error.message}`
      );
    }
  }
}
