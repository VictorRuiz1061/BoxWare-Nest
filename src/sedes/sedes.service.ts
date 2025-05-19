import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateSedeDto } from './dto/create-sede.dto';
import { UpdateSedeDto } from './dto/update-sede.dto';
import { Sede } from './entities/sede.entity';
import { Centro } from '../centros/entities/centro.entity'; // Importa la entidad Centro

@Injectable()
export class SedesService {
  constructor(
    @InjectRepository(Sede)
    private readonly sedeRepository: Repository<Sede>,
  ) {}

  async create(createSedeDto: CreateSedeDto) {
    const { centro_id, ...rest } = createSedeDto;

    console.log('Datos recibidos:', createSedeDto);

    const centro = centro_id
      ? await this.sedeRepository.manager.findOne(Centro, { where: { id_centro: centro_id } })
      : null;

    if (centro_id && !centro) {
      throw new NotFoundException(`Centro with ID ${centro_id} not found`);
    }

    const sede = this.sedeRepository.create({
      ...rest,
      ...(centro ? { centro } : {}),
    });

    console.log('Sede creada:', sede);

    return await this.sedeRepository.save(sede);
  }

  async findAll() {
    return await this.sedeRepository.find({
      relations: ['centro', 'areas'],
    });
  }

  async findOne(id: number) {
    const sede = await this.sedeRepository.findOne({
      where: { id_sede: id },
      relations: ['centro', 'areas'],
    });
    
    if (!sede) {
      throw new NotFoundException(`Sede with ID ${id} not found`);
    }
    
    return sede;
  }

  async update(id: number, updateSedeDto: UpdateSedeDto) {
    const { centro_id, ...rest } = updateSedeDto;

    const sede = await this.findOne(id);

    let centro: Centro | null = null;
    if (centro_id) {
      centro = await this.sedeRepository.manager.findOne(Centro, { where: { id_centro: centro_id } });
      if (!centro) {
        throw new NotFoundException(`Centro with ID ${centro_id} not found`);
      }
    }

    Object.assign(sede, rest, centro ? { centro } : {});

    return await this.sedeRepository.save(sede);
  }

  async remove(id: number) {
    const sede = await this.findOne(id);
    return await this.sedeRepository.remove(sede);
  }
}
