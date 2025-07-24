import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, EntityManager } from 'typeorm';
import { Movimiento } from './entities/movimiento.entity';
import { CreateMovimientoDto } from './dto/create-movimiento.dto';
import { UpdateMovimientoDto } from './dto/update-movimiento.dto';
import { Usuario } from '../usuarios/entities/usuario.entity';
import { TipoMovimiento } from 'src/tipos-movimientos/entities/tipos-movimiento.entity';
import { Material } from '../materiales/entities/materiale.entity';
import { Sitio } from '../sitios/entities/sitio.entity';
import { InventarioManagerService } from '../common/services/inventario-manager.service';
import { UbicacionesService } from '../ubicaciones/ubicaciones.service';

@Injectable()
export class MovimientosService {
  constructor(
    @InjectRepository(Movimiento)
    private readonly movimientoRepo: Repository<Movimiento>,
    @InjectRepository(Usuario)
    private readonly usuarioRepo: Repository<Usuario>,
    @InjectRepository(TipoMovimiento)
    private readonly tipoMovimientoRepo: Repository<TipoMovimiento>,
    @InjectRepository(Material)
    private readonly materialRepo: Repository<Material>,
    @InjectRepository(Sitio)
    private readonly sitioRepo: Repository<Sitio>,
    private readonly inventarioManager: InventarioManagerService,
    private readonly ubicacionesService: UbicacionesService,
    private readonly entityManager: EntityManager
  ) {}
  
  /**
   * Determina si un tipo de movimiento es una entrada de material
   * @param tipoMovimiento Tipo de movimiento a evaluar
   * @returns true si es una entrada, false en caso contrario
   */
  private esMovimientoEntrada(tipoMovimiento: TipoMovimiento): boolean {
    const tipoNombre = tipoMovimiento.tipo_movimiento.toLowerCase();
    return tipoNombre.includes('entrada') || 
           tipoNombre.includes('devolucion') || 
           tipoNombre.includes('ingreso');
}

  /**
   * Determina si un tipo de movimiento es una salida de material
   * @param tipoMovimiento Tipo de movimiento a evaluar
   * @returns true si es una salida, false en caso contrario
   */
  private esMovimientoSalida(tipoMovimiento: TipoMovimiento): boolean {
    const tipoNombre = tipoMovimiento.tipo_movimiento.toLowerCase();
    return tipoNombre.includes('salida') || 
           tipoNombre.includes('egreso') || 
           tipoNombre.includes('retiro') ||
           tipoNombre.includes('prestamo');
  }
  
  /**
   * Actualiza el stock de un material según el tipo de movimiento
   * @param material Material a actualizar
   * @param tipoMovimiento Tipo de movimiento
   * @param cantidad Cantidad del movimiento
   * @param sitioOrigenId ID del sitio de origen
   * @param sitioDestinoId ID del sitio de destino
   * @param responsableId ID del responsable (opcional)
   * @returns true si la operación fue exitosa, false en caso contrario
   */
  private async actualizarStock(
    material: Material, 
    tipoMovimiento: TipoMovimiento, 
    cantidad: number,
    sitioOrigenId: number,
    sitioDestinoId: number,
    responsableId?: number | null
  ): Promise<boolean> {
    const tipoNombre = tipoMovimiento.tipo_movimiento.toLowerCase();
    
    if (tipoNombre.includes('devolucion') || tipoNombre.includes('ingreso')) {
      // Para movimientos de entrada (devolución, ingreso), aumentar el stock en el sitio destino
      await this.inventarioManager.registrarDevolucion(material.id_material, sitioDestinoId, cantidad);
      
      // Actualizar ubicación actual del material
      await this.ubicacionesService.actualizarUbicacion({
        material_id: material.id_material,
        sitio_id: sitioDestinoId,
        cantidad: cantidad,
        estado: 'disponible',
        responsable_id: undefined
      });
      
      return true;
    } else if (tipoNombre.includes('salida') || tipoNombre.includes('prestamo') || tipoNombre.includes('egreso') || tipoNombre.includes('retiro')) {
      // Para movimientos de salida (préstamo, salida, egreso, retiro), disminuir el stock en el sitio origen
      await this.inventarioManager.registrarPrestamo(material.id_material, sitioOrigenId, cantidad);
      
      // Actualizar ubicación actual del material
      await this.ubicacionesService.actualizarUbicacion({
        material_id: material.id_material,
        sitio_id: sitioDestinoId,
        cantidad: cantidad,
        estado: tipoNombre.includes('prestamo') ? 'prestado' : 'trasladado',
        responsable_id: responsableId || undefined
      });
      
      return true;
    } else {
      // Si no es entrada ni salida, lanzar error
      throw new BadRequestException(`Tipo de movimiento no reconocido: ${tipoMovimiento.tipo_movimiento}`);
    }
  }
  
  /**
   * Revierte el efecto de un movimiento en el stock
   * @param material Material a actualizar
   * @param tipoMovimiento Tipo de movimiento a revertir
   * @param cantidad Cantidad del movimiento a revertir
   * @param sitioOrigenId ID del sitio de origen
   * @param sitioDestinoId ID del sitio de destino
   * @returns true si la operación fue exitosa, false en caso contrario
   */
  private async revertirMovimientoEnStock(
    material: Material, 
    tipoMovimiento: TipoMovimiento, 
    cantidad: number,
    sitioOrigenId: number,
    sitioDestinoId: number
  ): Promise<boolean> {
    const tipoNombre = tipoMovimiento.tipo_movimiento.toLowerCase();
    
    if (tipoNombre.includes('devolucion') || tipoNombre.includes('ingreso')) {
      // Revertir entrada: decrementar stock en sitio destino
      return await this.inventarioManager.registrarPrestamo(material.id_material, sitioDestinoId, cantidad);
    } else if (tipoNombre.includes('salida') || tipoNombre.includes('prestamo') || tipoNombre.includes('egreso') || tipoNombre.includes('retiro')) {
      // Revertir salida: incrementar stock en sitio origen
      return await this.inventarioManager.registrarDevolucion(material.id_material, sitioOrigenId, cantidad);
    }
    
    return false;
  }

  async create(dto: CreateMovimientoDto): Promise<Movimiento> {
    // Validar usuario
    const usuario = await this.usuarioRepo.findOneBy({ id_usuario: dto.usuario_id });
    if (!usuario) throw new NotFoundException(`Usuario con ID ${dto.usuario_id} no encontrado`);

    // Validar tipo de movimiento
    const tipo = await this.tipoMovimientoRepo.findOneBy({ id_tipo_movimiento: dto.tipo_movimiento });
    if (!tipo) throw new NotFoundException(`TipoMovimiento con ID ${dto.tipo_movimiento} no encontrado`);

    // Validar material
    const material = await this.materialRepo.findOneBy({ id_material: dto.material_id });
    if (!material) throw new NotFoundException(`Material con ID ${dto.material_id} no encontrado`);

    // Validar sitio origen
    const sitioOrigen = await this.sitioRepo.findOneBy({ id_sitio: dto.sitio_origen_id });
    if (!sitioOrigen) throw new NotFoundException(`Sitio origen con ID ${dto.sitio_origen_id} no encontrado`);
    
    // Validar sitio destino
    const sitioDestino = await this.sitioRepo.findOneBy({ id_sitio: dto.sitio_destino_id });
    if (!sitioDestino) throw new NotFoundException(`Sitio destino con ID ${dto.sitio_destino_id} no encontrado`);

    // Validar cantidad
    if (dto.cantidad <= 0) {
      throw new BadRequestException('La cantidad debe ser mayor que cero');
    }

    // Actualizar el stock del material y la ubicación
    const stockActualizado = await this.actualizarStock(
      material, 
      tipo, 
      dto.cantidad, 
      dto.sitio_origen_id, 
      dto.sitio_destino_id,
      dto.responsable_id
    );
    
    if (!stockActualizado) {
      throw new BadRequestException('No se pudo actualizar el stock del material');
    }

    // Crear y guardar el movimiento
    const nuevo = new Movimiento();
    nuevo.estado = dto.estado;
    nuevo.usuario = usuario;
    nuevo.usuario_movimiento_id = usuario.id_usuario;
    nuevo.tipo_movimiento_id = tipo.id_tipo_movimiento;
    nuevo.material_id = material.id_material;
    nuevo.cantidad = dto.cantidad;
    nuevo.sitio_origen = sitioOrigen;
    nuevo.sitio_origen_id = sitioOrigen.id_sitio;
    nuevo.sitio_destino = sitioDestino;
    nuevo.sitio_destino_id = sitioDestino.id_sitio;
    nuevo.observaciones = dto.observaciones || '';
    
    // Asignar responsable si existe
    if (dto.responsable_id) {
      const responsable = await this.usuarioRepo.findOneBy({ id_usuario: dto.responsable_id });
      if (responsable) {
        nuevo.responsable = responsable;
        nuevo.responsable_id = responsable.id_usuario;
      }
    }

    return this.movimientoRepo.save(nuevo);
  }

  async findAll(): Promise<Movimiento[]> {
    return this.movimientoRepo.find({ 
      relations: ['usuario', 'tipo_movimiento', 'material', 'sitio_origen', 'sitio_destino', 'responsable'] 
    });
  }

  async findOne(id: number): Promise<Movimiento> {
    const movimiento = await this.movimientoRepo.findOne({
      where: { id_movimiento: id },
      relations: ['usuario', 'tipo_movimiento', 'material', 'sitio_origen', 'sitio_destino', 'responsable'],
    });
    if (!movimiento) throw new NotFoundException(`Movimiento con ID ${id} no encontrado`);
    return movimiento;
  }

  async update(id: number, dto: UpdateMovimientoDto): Promise<Movimiento> {
    // Obtener el movimiento original con todas sus relaciones
    const movimientoOriginal = await this.movimientoRepo.findOne({
      where: { id_movimiento: id },
      relations: ['usuario', 'tipo_movimiento', 'material', 'sitio_origen', 'sitio_destino', 'responsable'],
    });
    
    if (!movimientoOriginal) {
      throw new NotFoundException(`Movimiento con ID ${id} no encontrado`);
    }

    // Variables para controlar los cambios en el stock
    let materialOriginal = movimientoOriginal.material ? movimientoOriginal.material.id_material : movimientoOriginal.material_id;
    let materialNuevo = materialOriginal;
    let cantidadOriginal = movimientoOriginal.cantidad; 
    let cantidadNueva = dto.cantidad || cantidadOriginal; 
    let tipoOriginal = movimientoOriginal.tipo_movimiento ? movimientoOriginal.tipo_movimiento.id_tipo_movimiento : movimientoOriginal.tipo_movimiento_id;
    let tipoNuevo = tipoOriginal;
    let sitioOrigenOriginal = movimientoOriginal.sitio_origen;
    let sitioOrigenNuevo = sitioOrigenOriginal;
    let sitioDestinoOriginal = movimientoOriginal.sitio_destino;
    let sitioDestinoNuevo = sitioDestinoOriginal;

    // Actualizar usuario si es necesario
    if (dto.usuario_id) {
      const usuario = await this.usuarioRepo.findOneBy({ id_usuario: dto.usuario_id });
      if (!usuario) throw new NotFoundException(`Usuario con ID ${dto.usuario_id} no encontrado`);
      movimientoOriginal.usuario = usuario;
    }

    // Actualizar tipo de movimiento si es necesario
    if (dto.tipo_movimiento) {
      const tipo = await this.tipoMovimientoRepo.findOneBy({ id_tipo_movimiento: dto.tipo_movimiento });
      if (!tipo) throw new NotFoundException(`TipoMovimiento con ID ${dto.tipo_movimiento} no encontrado`);
      tipoNuevo = tipo.id_tipo_movimiento;
      movimientoOriginal.tipo_movimiento = tipo;
      movimientoOriginal.tipo_movimiento_id = tipo.id_tipo_movimiento;
    }

    // Actualizar material si es necesario
    if (dto.material_id) {
      const material = await this.materialRepo.findOneBy({ id_material: dto.material_id });
      if (!material) throw new NotFoundException(`Material con ID ${dto.material_id} no encontrado`);
      materialNuevo = material.id_material;
      movimientoOriginal.material = material;
      movimientoOriginal.material_id = material.id_material;
    }

    // Actualizar sitio origen si es necesario
    if (dto.sitio_origen_id) {
      const sitioOrigen = await this.sitioRepo.findOneBy({ id_sitio: dto.sitio_origen_id });
      if (!sitioOrigen) throw new NotFoundException(`Sitio origen con ID ${dto.sitio_origen_id} no encontrado`);
      sitioOrigenNuevo = sitioOrigen;
      movimientoOriginal.sitio_origen = sitioOrigen;
    }
    
    // Actualizar sitio destino si es necesario
    if (dto.sitio_destino_id) {
      const sitioDestino = await this.sitioRepo.findOneBy({ id_sitio: dto.sitio_destino_id });
      if (!sitioDestino) throw new NotFoundException(`Sitio destino con ID ${dto.sitio_destino_id} no encontrado`);
      sitioDestinoNuevo = sitioDestino;
      movimientoOriginal.sitio_destino = sitioDestino;
    }
    
    // Actualizar responsable si es necesario
    if (dto.responsable_id !== undefined) {
      if (dto.responsable_id === null) {
        // Si se proporciona null, eliminar la relación con el responsable
        movimientoOriginal.responsable = undefined as any;
      } else {
        const responsable = await this.usuarioRepo.findOneBy({ id_usuario: dto.responsable_id });
        if (!responsable) throw new NotFoundException(`Usuario responsable con ID ${dto.responsable_id} no encontrado`);
        movimientoOriginal.responsable = responsable;
      }
    }

    // Si hay cambios en el material, tipo, cantidad o sitios, actualizar el stock
    if (dto.material_id || dto.tipo_movimiento || dto.cantidad || dto.sitio_origen_id || dto.sitio_destino_id) {
      // Revertir el efecto del movimiento original en el stock
      if (materialOriginal) {
        const materialObj = await this.materialRepo.findOneBy({ id_material: materialOriginal });
        const tipoObj = await this.tipoMovimientoRepo.findOneBy({ id_tipo_movimiento: tipoOriginal });
        
        if (materialObj && tipoObj) {
          await this.revertirMovimientoEnStock(
            materialObj,
            tipoObj,
            cantidadOriginal,
            sitioOrigenOriginal.id_sitio,
            sitioDestinoOriginal.id_sitio
          );
        }
      }

      // Aplicar el efecto del nuevo movimiento
      if (materialNuevo) {
        const materialObj = await this.materialRepo.findOneBy({ id_material: materialNuevo });
        const tipoObj = await this.tipoMovimientoRepo.findOneBy({ id_tipo_movimiento: tipoNuevo });
        
        if (materialObj && tipoObj) {
          await this.actualizarStock(
            materialObj,
            tipoObj,
            cantidadNueva,
            sitioOrigenNuevo.id_sitio,
            sitioDestinoNuevo.id_sitio,
            movimientoOriginal.responsable?.id_usuario
          );
        }
      }
    }

    // Actualizar los demás campos del movimiento
    if (dto.observaciones !== undefined) {
      movimientoOriginal.observaciones = dto.observaciones;
    }
    
    if (dto.cantidad !== undefined) {
      movimientoOriginal.cantidad = dto.cantidad;
    }
    
    if (dto.estado !== undefined) {
      movimientoOriginal.estado = dto.estado;
    }

    return this.movimientoRepo.save(movimientoOriginal);
  }

  async remove(id: number): Promise<void> {
    // Obtener el movimiento antes de eliminarlo para actualizar el stock
    const movimiento = await this.movimientoRepo.findOne({
      where: { id_movimiento: id },
      relations: ['tipo_movimiento', 'material', 'sitio_origen', 'sitio_destino'],
    });
    
    if (!movimiento) {
      throw new NotFoundException(`Movimiento con ID ${id} no encontrado`);
    }
    
    // Revertir el efecto del movimiento en el stock
    if (movimiento.material_id && movimiento.tipo_movimiento_id) {
      const materialObj = await this.materialRepo.findOneBy({ id_material: movimiento.material_id });
      const tipoObj = await this.tipoMovimientoRepo.findOneBy({ id_tipo_movimiento: movimiento.tipo_movimiento_id });
      
      if (materialObj && tipoObj) {
        await this.revertirMovimientoEnStock(
          materialObj,
          tipoObj,
          movimiento.cantidad,
          movimiento.sitio_origen.id_sitio,
          movimiento.sitio_destino.id_sitio
        );
      }
    }
    
    // Eliminar el movimiento
    const result = await this.movimientoRepo.delete(id);
    if (result.affected === 0) {
      throw new NotFoundException(`Movimiento con ID ${id} no encontrado`);
    }
  }
}
