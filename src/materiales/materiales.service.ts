import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Material } from './entities/materiale.entity';
import { CreateMaterialeDto } from './dto/create-materiale.dto';
import { UpdateMaterialeDto } from './dto/update-materiale.dto';

@Injectable()
export class MaterialesService {
  constructor(
    @InjectRepository(Material)
    private readonly materialRepo: Repository<Material>,
  ) {}

  async create(dto: CreateMaterialeDto): Promise<Material> {
    const nuevoMaterial = this.materialRepo.create(dto);
    return this.materialRepo.save(nuevoMaterial);
  }
  
  async findAll(): Promise<Material[]> {
    return this.materialRepo.find({
      relations: ['categoria_id', 'tipo_material_id', 'sitio_id'],
    });
  }

  async findOne(id: number): Promise<Material> {
    const material = await this.materialRepo.findOne({
      where: { id_material: id },
      relations: ['categoria_id', 'tipo_material_id', 'sitio_id'],
    });
    if (!material) {
      throw new NotFoundException(`Material con ID ${id} no encontrado`);
    }
    return material;
  }

  async update(id: number, dto: UpdateMaterialeDto): Promise<Material> {
    const existente = await this.findOne(id);
    const actualizado = Object.assign(existente, dto);
    return this.materialRepo.save(actualizado);
  }

  async remove(id: number): Promise<void> {
    const result = await this.materialRepo.delete(id);
    if (result.affected === 0) {
      throw new NotFoundException(`Material con ID ${id} no encontrado`);
    }
  }
}


