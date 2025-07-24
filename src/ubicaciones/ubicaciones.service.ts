import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UbicacionActual } from './entities/ubicacion-actual.entity';
import { Material } from '../materiales/entities/materiale.entity';
import { Sitio } from '../sitios/entities/sitio.entity';
import { Usuario } from '../usuarios/entities/usuario.entity';
import { UbicacionResponseDto } from './dto/ubicacion-response.dto';

@Injectable()
export class UbicacionesService {
  constructor(
    @InjectRepository(UbicacionActual)
    private ubicacionRepo: Repository<UbicacionActual>,
    @InjectRepository(Material)
    private materialRepo: Repository<Material>,
    @InjectRepository(Sitio)
    private sitioRepo: Repository<Sitio>,
    @InjectRepository(Usuario)
    private usuarioRepo: Repository<Usuario>
  ) {}

  async actualizarUbicacion(datos: {
    material_id: number;
    sitio_id: number;
    cantidad: number;
    estado: string;
    responsable_id?: number | null;
  }): Promise<UbicacionActual> {
    // Verificar que el material existe
    const materialExiste = await this.materialRepo.findOneBy({ id_material: datos.material_id });
    if (!materialExiste) {
      throw new NotFoundException(`Material con ID ${datos.material_id} no encontrado`);
    }

    // Verificar que el sitio existe
    const sitioExiste = await this.sitioRepo.findOneBy({ id_sitio: datos.sitio_id });
    if (!sitioExiste) {
      throw new NotFoundException(`Sitio con ID ${datos.sitio_id} no encontrado`);
    }

    // Verificar responsable si se proporciona
    if (datos.responsable_id) {
      const responsableExiste = await this.usuarioRepo.findOneBy({ id_usuario: datos.responsable_id });
      if (!responsableExiste) {
        throw new NotFoundException(`Usuario con ID ${datos.responsable_id} no encontrado`);
      }
    }

    // Buscar si ya existe una ubicación para este material
    let ubicacion = await this.ubicacionRepo.findOne({
      where: { material_id: datos.material_id }
    });

    if (ubicacion) {
      // Actualizar ubicación existente
      ubicacion.sitio_id = datos.sitio_id;
      ubicacion.cantidad = datos.cantidad;
      ubicacion.estado = datos.estado;
      ubicacion.responsable_id = datos.responsable_id === undefined ? ubicacion.responsable_id : datos.responsable_id;
    } else {
      // Crear nueva ubicación
      ubicacion = this.ubicacionRepo.create();
      ubicacion.material_id = datos.material_id;
      ubicacion.sitio_id = datos.sitio_id;
      ubicacion.cantidad = datos.cantidad;
      ubicacion.estado = datos.estado;
      ubicacion.responsable_id = datos.responsable_id;
    }

    return this.ubicacionRepo.save(ubicacion);
  }

  async obtenerUbicacion(materialId: number): Promise<UbicacionResponseDto> {
    const ubicacion = await this.ubicacionRepo.findOne({
      where: { material_id: materialId }
    });

    if (!ubicacion) {
      throw new NotFoundException(`No se encontró ubicación para el material con ID ${materialId}`);
    }

    // Obtener datos relacionados manualmente
    const material = await this.materialRepo.findOneBy({ id_material: ubicacion.material_id });
    const sitio = await this.sitioRepo.findOneBy({ id_sitio: ubicacion.sitio_id });
    let responsable: Usuario | null = null;
    
    if (ubicacion.responsable_id) {
      responsable = await this.usuarioRepo.findOneBy({ id_usuario: ubicacion.responsable_id });
    }

    // Construir respuesta
    return {
      id: ubicacion.id,
      material_id: ubicacion.material_id,
      sitio_id: ubicacion.sitio_id,
      responsable_id: ubicacion.responsable_id,
      cantidad: ubicacion.cantidad,
      estado: ubicacion.estado,
      ultima_actualizacion: ubicacion.ultima_actualizacion,
      material: material,
      sitio: sitio,
      responsable: responsable
    };
  }

  async obtenerMaterialesPorEstado(
    estado: string,
    responsableId?: number,
    sitioId?: number
  ): Promise<UbicacionResponseDto[]> {
    const query = this.ubicacionRepo.createQueryBuilder('ubicacion')
      .where('ubicacion.estado = :estado', { estado });

    if (responsableId) {
      query.andWhere('ubicacion.responsable_id = :responsableId', { responsableId });
    }

    if (sitioId) {
      query.andWhere('ubicacion.sitio_id = :sitioId', { sitioId });
    }

    const ubicaciones = await query.getMany();
    
    // Obtener datos relacionados para cada ubicación
    const resultados: UbicacionResponseDto[] = [];
    
    for (const ubicacion of ubicaciones) {
      const material = await this.materialRepo.findOneBy({ id_material: ubicacion.material_id });
      const sitio = await this.sitioRepo.findOneBy({ id_sitio: ubicacion.sitio_id });
      let responsable: Usuario | null = null;
      
      if (ubicacion.responsable_id) {
        responsable = await this.usuarioRepo.findOneBy({ id_usuario: ubicacion.responsable_id });
      }
      
      resultados.push({
        id: ubicacion.id,
        material_id: ubicacion.material_id,
        sitio_id: ubicacion.sitio_id,
        responsable_id: ubicacion.responsable_id,
        cantidad: ubicacion.cantidad,
        estado: ubicacion.estado,
        ultima_actualizacion: ubicacion.ultima_actualizacion,
        material: material,
        sitio: sitio,
        responsable: responsable
      });
    }
    
    return resultados;
  }
} 