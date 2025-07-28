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
import { AlertaManagerService } from '../common/services/alerta-manager.service';

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
    private readonly inventarioManager: InventarioManagerService,
    private readonly alertaManager: AlertaManagerService,
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
           tipoNombre.includes('devolucion');
}
  
  /**
   * Determina si un tipo de movimiento es una salida de material
   * @param tipoMovimiento Tipo de movimiento a evaluar
   * @returns true si es una salida, false en caso contrario
   */
  private esMovimientoSalida(tipoMovimiento: TipoMovimiento): boolean {
    const tipoNombre = tipoMovimiento.tipo_movimiento.toLowerCase();
    return tipoNombre.includes('salida') || 
           tipoNombre.includes('prestamo') || 
           tipoNombre.includes('retiro');
  }
  
  /**
   * Actualiza el stock de un material según el tipo de movimiento
   * @param material Material a actualizar
   * @param tipoMovimiento Tipo de movimiento
   * @param cantidad Cantidad del movimiento
   * @param sitioId ID del sitio donde se realiza el movimiento
   * @returns true si la operación fue exitosa, false en caso contrario
   */
  private async actualizarStock(
    material: Material, 
    tipoMovimiento: TipoMovimiento, 
    cantidad: number,
    sitioId: number
  ): Promise<boolean> {
    if (this.esMovimientoEntrada(tipoMovimiento)) {
      // Para movimientos de entrada, aumentar el stock
      return await this.inventarioManager.registrarDevolucion(material.id_material, sitioId, cantidad);
    } else if (this.esMovimientoSalida(tipoMovimiento)) {
      // Para movimientos de salida, disminuir el stock
      // Ahora valida el stock suficiente antes de prestar
      return await this.inventarioManager.registrarPrestamo(material.id_material, sitioId, cantidad);
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
   * @param sitioId ID del sitio donde se realiza el movimiento
   * @returns true si la operación fue exitosa, false en caso contrario
   */
  private async revertirMovimientoEnStock(
    material: Material, 
    tipoMovimiento: TipoMovimiento, 
    cantidad: number,
    sitioId: number
  ): Promise<boolean> {
    if (this.esMovimientoEntrada(tipoMovimiento)) {
      // Revertir entrada: decrementar stock (registrar préstamo)
      return await this.inventarioManager.registrarPrestamo(material.id_material, sitioId, cantidad);
    } else if (this.esMovimientoSalida(tipoMovimiento)) {
      // Revertir salida: incrementar stock (registrar devolución)
      return await this.inventarioManager.registrarDevolucion(material.id_material, sitioId, cantidad);
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

    // Validar cantidad
    if (dto.cantidad <= 0) {
      throw new BadRequestException('La cantidad debe ser mayor que cero');
    }

    // Si es préstamo o devolución, transferir entre dos sitios
    const tipoNombre = tipo.tipo_movimiento.toLowerCase();
    if (tipoNombre.includes('prestamo') || tipoNombre.includes('devolucion')) {
      if (!dto.sitio_origen_id || !dto.sitio_destino_id) {
        throw new BadRequestException('Para movimientos de préstamo o devolución se requieren sitio_origen_id y sitio_destino_id');
      }
      await this.inventarioManager.transferirMaterial(
        material.id_material,
        dto.sitio_origen_id,
        dto.sitio_destino_id,
        dto.cantidad
      );
      
      // Crear alerta de transferencia
      await this.alertaManager.alertarTransferencia(
        material.id_material,
        dto.sitio_origen_id,
        dto.sitio_destino_id,
        dto.cantidad,
        dto.usuario_id
      );
    } else {
      // Actualizar el stock del material usando el servicio común de gestión de inventario
      const stockActualizado = await this.actualizarStock(material, tipo, dto.cantidad, dto.sitio_id);
      if (!stockActualizado) {
        throw new BadRequestException('No se pudo actualizar el stock del material');
      }
      
      // Crear alertas según el tipo de movimiento
      if (this.esMovimientoEntrada(tipo)) {
        await this.alertaManager.alertarDevolucion(
          material.id_material,
          dto.sitio_id,
          dto.cantidad,
          dto.usuario_id
        );
      } else if (this.esMovimientoSalida(tipo)) {
        await this.alertaManager.alertarPrestamo(
          material.id_material,
          dto.sitio_id,
          dto.cantidad,
          dto.usuario_id
        );
      }
    }

    // Crear y guardar el movimiento
    const nuevo = this.movimientoRepo.create();
    nuevo.estado = dto.estado;
    nuevo.usuario = usuario;
    nuevo.tipo_movimiento_id = tipo;
    nuevo.material_id = material;
    nuevo.cantidad = dto.cantidad;

    // Guardar la referencia al sitio (para movimientos normales)
    if (dto.sitio_id) {
      const sitio = await this.entityManager.findOne(Sitio, {
        where: { id_sitio: dto.sitio_id }
      });
      if (sitio) {
        nuevo.sitio = sitio;
      }
    }

    // Guardar los sitios de origen y destino si aplica
    if (dto.sitio_origen_id) {
      nuevo.sitio_origen_id = dto.sitio_origen_id;
    }
    if (dto.sitio_destino_id) {
      nuevo.sitio_destino_id = dto.sitio_destino_id;
    }

    return this.movimientoRepo.save(nuevo);
  }

  async findAll(): Promise<Movimiento[]> {
    return this.movimientoRepo.find({ 
      relations: ['usuario', 'tipo_movimiento_id', 'material_id', 'sitio'] 
    });
  }

  async findOne(id: number): Promise<Movimiento> {
    const movimiento = await this.movimientoRepo.findOne({
      where: { id_movimiento: id },
      relations: ['usuario', 'tipo_movimiento_id', 'material_id', 'sitio'],
    });
    if (!movimiento) throw new NotFoundException(`Movimiento con ID ${id} no encontrado`);
    return movimiento;
  }

  async update(id: number, dto: UpdateMovimientoDto): Promise<Movimiento> {
    // Obtener el movimiento original con todas sus relaciones
    const movimientoOriginal = await this.movimientoRepo.findOne({
      where: { id_movimiento: id },
      relations: ['usuario', 'tipo_movimiento_id', 'material_id'],
    });
    
    if (!movimientoOriginal) {
      throw new NotFoundException(`Movimiento con ID ${id} no encontrado`);
    }

    // Variables para controlar los cambios en el stock
    let materialOriginal = movimientoOriginal.material_id;
    let materialNuevo = materialOriginal;
    let cantidadOriginal = movimientoOriginal.cantidad; 
    let cantidadNueva = dto.cantidad || cantidadOriginal; 
    let tipoOriginal = movimientoOriginal.tipo_movimiento_id;
    let tipoNuevo = tipoOriginal;
    let sitioId = dto.sitio_id || 1; // Usar el sitio_id proporcionado o un valor predeterminado

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
      tipoNuevo = tipo;
      movimientoOriginal.tipo_movimiento_id = tipo;
    }

    // Actualizar material si es necesario
    if (dto.material_id) {
      const material = await this.materialRepo.findOneBy({ id_material: dto.material_id });
      if (!material) throw new NotFoundException(`Material con ID ${dto.material_id} no encontrado`);
      materialNuevo = material;
      movimientoOriginal.material_id = material;
    }

    // Si hay cambios en el material, tipo o cantidad, actualizar el stock
    if (dto.material_id || dto.tipo_movimiento || dto.cantidad) {
      // Revertir el efecto del movimiento original en el stock
      if (materialOriginal) {
        await this.revertirMovimientoEnStock(
          materialOriginal, 
          tipoOriginal, 
          cantidadOriginal,
          sitioId
        );
      }

      // Aplicar el efecto del nuevo movimiento
      if (materialNuevo) {
        await this.actualizarStock(
          materialNuevo, 
          tipoNuevo, 
          cantidadNueva,
          sitioId
        );
      }
    }

    // Actualizar los demás campos del movimiento
    Object.assign(movimientoOriginal, dto);
    return this.movimientoRepo.save(movimientoOriginal);
  }

  async remove(id: number): Promise<void> {
    // Obtener el movimiento antes de eliminarlo para actualizar el stock
    const movimiento = await this.movimientoRepo.findOne({
      where: { id_movimiento: id },
      relations: ['tipo_movimiento_id', 'material_id'],
    });
    
    if (!movimiento) {
      throw new NotFoundException(`Movimiento con ID ${id} no encontrado`);
    }
    
    // Revertir el efecto del movimiento en el stock
    if (movimiento.material_id && movimiento.tipo_movimiento_id) {
      // Usar un valor predeterminado para el sitio_id si no está disponible
      const sitioId = 1; // Valor predeterminado, idealmente debería estar almacenado en el movimiento
      
      await this.revertirMovimientoEnStock(
        movimiento.material_id,
        movimiento.tipo_movimiento_id,
        movimiento.cantidad,
        sitioId
      );
    }
    
    // Eliminar el movimiento
    const result = await this.movimientoRepo.delete(id);
    if (result.affected === 0) {
      throw new NotFoundException(`Movimiento con ID ${id} no encontrado`);
    }
  }

  /**
   * Para transferir materiales entre sitios, se debe usar el método transferirMaterial del InventarioManagerService
   * Ejemplo de uso:
   * await this.inventarioManager.transferirMaterial(materialId, sitioOrigenId, sitioDestinoId, cantidad);
   * Esto validará el stock y actualizará ambos inventarios correctamente.
   */
}
