import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Movimiento } from './entities/movimiento.entity';
import { CreateMovimientoDto } from './dto/create-movimiento.dto';
import { UpdateMovimientoDto } from './dto/update-movimiento.dto';
import { Usuario } from '../usuarios/entities/usuario.entity';
import { TipoMovimiento } from 'src/tipos-movimientos/entities/tipos-movimiento.entity';

@Injectable()
export class MovimientosService {
  constructor(
    @InjectRepository(Movimiento)
    private readonly movimientoRepo: Repository<Movimiento>,
    @InjectRepository(Usuario)
    private readonly usuarioRepo: Repository<Usuario>,
    @InjectRepository(TipoMovimiento)
    private readonly tipoMovimientoRepo: Repository<TipoMovimiento>,
  ) {}

  async create(dto: CreateMovimientoDto): Promise<Movimiento> {
    const usuario = await this.usuarioRepo.findOneBy({ id_usuario: dto.usuario_id });
    if (!usuario) throw new NotFoundException(`Usuario con ID ${dto.usuario_id} no encontrado`);

    const tipo = await this.tipoMovimientoRepo.findOneBy({ id_tipo_movimiento: dto.tipo_movimiento });
    if (!tipo) throw new NotFoundException(`TipoMovimiento con ID ${dto.tipo_movimiento} no encontrado`);

    const nuevo = this.movimientoRepo.create({
      ...dto,
      usuario: usuario,
      tipo_movimiento_id: tipo,
    });

    return this.movimientoRepo.save(nuevo);
  }

  async findAll(): Promise<Movimiento[]> {
    return this.movimientoRepo.find({ relations: ['usuario', 'tipo_movimiento_id'] });
  }

  async findOne(id: number): Promise<Movimiento> {
    const movimiento = await this.movimientoRepo.findOne({
      where: { id_movimiento: id },
      relations: ['usuario', 'tipo_movimiento_id'],
    });
    if (!movimiento) throw new NotFoundException(`Movimiento con ID ${id} no encontrado`);
    return movimiento;
  }

  async update(id: number, dto: UpdateMovimientoDto): Promise<Movimiento> {
    const movimiento = await this.findOne(id);

    if (dto.usuario_id) {
      const usuario = await this.usuarioRepo.findOneBy({ id_usuario: dto.usuario_id });
      if (!usuario) throw new NotFoundException(`Usuario con ID ${dto.usuario_id} no encontrado`);
      movimiento.usuario = usuario;
    }

    if (dto.tipo_movimiento) {
      const tipo = await this.tipoMovimientoRepo.findOneBy({ id_tipo_movimiento: dto.tipo_movimiento });
      if (!tipo) throw new NotFoundException(`TipoMovimiento con ID ${dto.tipo_movimiento} no encontrado`);
      movimiento.tipo_movimiento_id = tipo;
    }

    Object.assign(movimiento, dto);
    return this.movimientoRepo.save(movimiento);
  }

  async remove(id: number): Promise<void> {
    const result = await this.movimientoRepo.delete(id);
    if (result.affected === 0) {
      throw new NotFoundException(`Movimiento con ID ${id} no encontrado`);
    }
  }
}
