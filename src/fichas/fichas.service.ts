// src/fichas/fichas.service.ts
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateFichaDto } from './dto/create-ficha.dto';
import { UpdateFichaDto } from './dto/update-ficha.dto';
import { Ficha } from './entities/ficha.entity';
import { Programa } from 'src/programas/entities/programa.entity';
import { Usuario } from 'src/usuarios/entities/usuario.entity';

@Injectable()
export class FichasService {
  constructor(
    @InjectRepository(Ficha)
    private fichaRepository: Repository<Ficha>,
  ) {}

  async create(createFichaDto: CreateFichaDto): Promise<Ficha> {
    const { programa_id, usuario_id, ...rest } = createFichaDto;

    const programaEntity = await this.fichaRepository.manager.findOne(Programa, {
      where: { id_programa: programa_id },
    });

    if (!programaEntity) {
      throw new NotFoundException(`Programa con ID ${programa_id} no encontrado`);
    }

    const usuarioEntity = await this.fichaRepository.manager.findOne(Usuario, {
      where: { id_usuario: usuario_id },
    });

    if (!usuarioEntity) {
      throw new NotFoundException(`Usuario con ID ${usuario_id} no encontrado`);
    }

    const ficha = this.fichaRepository.create({
      ...rest,
      programa: programaEntity,
      usuario: usuarioEntity,
    });

    return this.fichaRepository.save(ficha);
  }

  findAll(): Promise<Ficha[]> {
    return this.fichaRepository.find({
      relations: ['programa', 'usuario'],
    });
  }
  
  async findOne(id: number): Promise<Ficha> {
    const ficha = await this.fichaRepository.findOne({
      where: { id_ficha: id },
      relations: ['programa', 'usuario'],
    });
    if (!ficha) {
      throw new NotFoundException(`Ficha con ID ${id} no encontrada`);
    }
    return ficha;
  } 

  async update(id: number, updateFichaDto: UpdateFichaDto): Promise<Ficha> {
    const ficha = await this.findOne(id);
    Object.assign(ficha, updateFichaDto);
    return this.fichaRepository.save(ficha);
  }

  async remove(id: number): Promise<void> {
    const ficha = await this.findOne(id);
    await this.fichaRepository.remove(ficha);
  }
}

