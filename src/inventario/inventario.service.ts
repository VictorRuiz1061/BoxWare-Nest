import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateInventarioDto } from './dto/create-inventario.dto';
import { UpdateInventarioDto } from './dto/update-inventario.dto';
import { Inventario } from './entities/inventario.entity';
import { Sitio } from '../sitios/entities/sitio.entity';
import { NotificacionesManagerService } from '../common/services/notificaciones-manager.service';

@Injectable()
export class InventarioService {
  constructor(
    @InjectRepository(Inventario)
    private readonly inventarioRepo: Repository<Inventario>,
    @InjectRepository(Sitio)
    private readonly sitioRepo: Repository<Sitio>,
    private readonly notificacionesManager: NotificacionesManagerService
  ) {}

  async create(createInventarioDto: CreateInventarioDto): Promise<Inventario> {
    const { sitio_id, material_id, stock, placa_sena, descripcion } = createInventarioDto;

    const sitio = await this.sitioRepo.findOneBy({ id_sitio: sitio_id });
    if (!sitio) throw new NotFoundException(`Sitio con ID ${sitio_id} no encontrado`);

    // Buscar si ya existe inventario para ese material y sitio
    let inventario = await this.inventarioRepo.findOne({ where: { sitio: { id_sitio: sitio_id }, material_id } });
    let stockAnterior = 0;
    
    if (inventario) {
      // Si ya existe, solo actualiza el stock
      stockAnterior = inventario.stock;
      inventario.stock += stock;
    } else {
      inventario = this.inventarioRepo.create({ sitio, material_id, stock });
      // Crear alerta de material nuevo
      await this.notificacionesManager.alertarMaterialNuevo(material_id, sitio_id, stock, 1); // Usuario ID 1 por defecto
    }

    if (placa_sena) {
      inventario.placa_sena = placa_sena;
    }
    if (descripcion) {
      inventario.descripcion = descripcion;
    }
    
    const inventarioGuardado = await this.inventarioRepo.save(inventario);
    
    // Verificar alertas de stock si es una actualización
    if (stockAnterior > 0) {
      await this.notificacionesManager.verificarAlertasStock(
        material_id, 
        sitio_id, 
        inventarioGuardado.stock, 
        stockAnterior
      );
    }
    
    return inventarioGuardado;
  }

  async findAll(): Promise<Inventario[]> {
    return this.inventarioRepo.find({ relations: ['sitio'] });
  }

  async findOne(id: number): Promise<Inventario> {
    const inventario = await this.inventarioRepo.findOne({ where: { id_inventario: id }, relations: ['sitio'] });
    if (!inventario) {
      throw new NotFoundException(`Inventario con ID ${id} no encontrado`);
    }
    return inventario;
  }

  async findByMaterialAndSitio(materialId: number, sitioId: number): Promise<Inventario | null> {
    return this.inventarioRepo.findOne({ where: { material_id: materialId, sitio: { id_sitio: sitioId } }, relations: ['sitio'] });
  }

  async update(id: number, updateInventarioDto: UpdateInventarioDto): Promise<Inventario> {
    const inventario = await this.findOne(id);
    if (updateInventarioDto.sitio_id) {
      const sitio = await this.sitioRepo.findOneBy({ id_sitio: updateInventarioDto.sitio_id });
      if (!sitio) {
        throw new NotFoundException(`Sitio con ID ${updateInventarioDto.sitio_id} no encontrado`);
      }
      inventario.sitio = sitio;
    }
    if (updateInventarioDto.material_id !== undefined) {
      inventario.material_id = updateInventarioDto.material_id;
    }
    if (updateInventarioDto.stock !== undefined) {
      inventario.stock = updateInventarioDto.stock;
    }
    return this.inventarioRepo.save(inventario);
  }

  async remove(id: number): Promise<void> {
    const result = await this.inventarioRepo.delete(id);
    if (result.affected === 0) {
      throw new NotFoundException(`Inventario con ID ${id} no encontrado`);
    }
  }

  async actualizarStock(materialId: number, sitioId: number, cantidad: number): Promise<Inventario> {
    let inventario = await this.findByMaterialAndSitio(materialId, sitioId);
    let stockAnterior = 0;
    
    if (!inventario && cantidad > 0) {
      const sitio = await this.sitioRepo.findOneBy({ id_sitio: sitioId });
      if (!sitio) {
        throw new NotFoundException(`Sitio con ID ${sitioId} no encontrado`);
      }
      inventario = this.inventarioRepo.create({ sitio, material_id: materialId, stock: cantidad });
    } else if (!inventario && cantidad < 0) {
      throw new BadRequestException(`No existe inventario para el material ${materialId} en el sitio ${sitioId}`);
    } else if (inventario) {
      stockAnterior = inventario.stock;
      const nuevoStock = inventario.stock + cantidad;
      if (nuevoStock < 0) {
        throw new BadRequestException(`Stock insuficiente para el material ${materialId} en el sitio ${sitioId}. Stock actual: ${inventario.stock}, Cantidad a restar: ${Math.abs(cantidad)}`);
      }
      inventario.stock = nuevoStock;
    } else {
      throw new BadRequestException('Error inesperado al actualizar el inventario');
    }
    
    const inventarioGuardado = await this.inventarioRepo.save(inventario);
    
    // Verificar alertas de stock
    if (stockAnterior > 0) {
      await this.notificacionesManager.verificarAlertasStock(
        materialId, 
        sitioId, 
        inventarioGuardado.stock, 
        stockAnterior
      );
    }
    
    return inventarioGuardado;
  }
}
