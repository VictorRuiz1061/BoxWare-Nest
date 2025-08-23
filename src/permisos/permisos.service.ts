import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Not } from 'typeorm';
import { Permiso } from './entities/permiso.entity';
import { CreatePermisoDto } from './dto/create-permiso.dto';
import { UpdatePermisoDto } from './dto/update-permiso.dto';
import { Modulo } from '../modulos/entities/modulo.entity';
import { Rol } from 'src/roles/entities/role.entity';
import { Usuario } from 'src/usuarios/entities/usuario.entity';

@Injectable()
export class PermisoService {
  constructor(
    @InjectRepository(Permiso)
    private readonly permisoRepository: Repository<Permiso>,
    @InjectRepository(Modulo)
    private readonly moduloRepository: Repository<Modulo>,
    @InjectRepository(Rol)
    private readonly rolRepository: Repository<Rol>,
    @InjectRepository(Usuario)
    private readonly usuarioRepository: Repository<Usuario>,
  ) {}

  async create(createPermisoDto: CreatePermisoDto): Promise<Permiso[]> {
    const { rol_id, modulo_id: modulosIds, ...datosPermiso } = createPermisoDto;

    // Validar que el rol exista
    const rol = await this.rolRepository.findOneBy({ id_rol: rol_id });
    if (!rol) {
      throw new NotFoundException(`Rol con ID ${rol_id} no encontrado`);
    }

    // Validar que los módulos existan
    const modulos = await this.moduloRepository.findByIds(modulosIds);
    if (modulos.length !== modulosIds.length) {
      const encontradosIds = modulos.map(m => m.id_modulo);
      const noEncontrados = modulosIds.filter(id => !encontradosIds.includes(id));
      throw new NotFoundException(`Módulos no encontrados: ${noEncontrados.join(', ')}`);
    }

    // Verificar si ya existe un permiso con el mismo nombre y rol
    let permisoExistente = await this.permisoRepository.findOne({
      where: {
        nombre: datosPermiso.nombre,
        rol_id: { id_rol: rol.id_rol },
      },
    });

    if (permisoExistente) {
      // Actualizar el permiso existente con todos los módulos
      permisoExistente.puede_ver = datosPermiso.puede_ver ?? permisoExistente.puede_ver;
      permisoExistente.puede_crear = datosPermiso.puede_crear ?? permisoExistente.puede_crear;
      permisoExistente.puede_actualizar = datosPermiso.puede_actualizar ?? permisoExistente.puede_actualizar;
      permisoExistente.estado = datosPermiso.estado ?? permisoExistente.estado;
      permisoExistente.modulo_id = modulosIds; // Guardar todos los módulos
      
      const permisoActualizado = await this.permisoRepository.save(permisoExistente);
      return [permisoActualizado];
    } else {
      // Crear UN SOLO permiso con TODOS los módulos
      const nuevoPermiso = this.permisoRepository.create({
        nombre: datosPermiso.nombre,
        puede_ver: datosPermiso.puede_ver ?? false,
        puede_crear: datosPermiso.puede_crear ?? false,
        puede_actualizar: datosPermiso.puede_actualizar ?? false,
        puede_eliminar: false,
        estado: datosPermiso.estado ?? true,
        rol_id: rol,
        modulo_id: modulosIds, // Guardar TODOS los módulos como array
      });
      
      const permisoGuardado = await this.permisoRepository.save(nuevoPermiso);
      return [permisoGuardado];
    }
  }

  async findAll(): Promise<Permiso[]> {
    return this.permisoRepository.find({
      relations: ['rol_id'],
    });
  }

  async findOne(id: number): Promise<Permiso> {
    const permiso = await this.permisoRepository.findOne({
      where: { id_permiso: id },
      relations: ['rol_id'],
    });

    if (!permiso) {
      throw new NotFoundException(`Permiso con ID ${id} no encontrado`);
    }

    return permiso;
  }

  async update(id: number, updatePermisoDto: UpdatePermisoDto): Promise<Permiso> {
    const permisoExistente = await this.permisoRepository.findOne({
      where: { id_permiso: id },
      relations: ['rol_id'],
    });
    
    if (!permisoExistente) {
      throw new NotFoundException(`Permiso con ID ${id} no encontrado`);
    }

    const { rol_id, modulo_id: modulosIds, ...datosPermiso } = updatePermisoDto;

    // Si se proporciona un nuevo rol_id, validar que exista
    if (rol_id) {
      const rol = await this.rolRepository.findOneBy({ id_rol: rol_id });
      if (!rol) {
        throw new NotFoundException(`Rol con ID ${rol_id} no encontrado`);
      }
      permisoExistente.rol_id = rol;
    }

    // Si se proporcionan módulos, validar que existan
    if (modulosIds && Array.isArray(modulosIds)) {
      const modulos = await this.moduloRepository.findByIds(modulosIds);
      if (modulos.length !== modulosIds.length) {
        const encontradosIds = modulos.map(m => m.id_modulo);
        const noEncontrados = modulosIds.filter(id => !encontradosIds.includes(id));
        throw new NotFoundException(`Módulos no encontrados: ${noEncontrados.join(', ')}`);
      }
      permisoExistente.modulo_id = modulosIds;
    }

    // Actualizar campos simples
    permisoExistente.nombre = datosPermiso.nombre ?? permisoExistente.nombre;
    permisoExistente.puede_ver = datosPermiso.puede_ver ?? permisoExistente.puede_ver;
    permisoExistente.puede_crear = datosPermiso.puede_crear ?? permisoExistente.puede_crear;
    permisoExistente.puede_actualizar = datosPermiso.puede_actualizar ?? permisoExistente.puede_actualizar;
    permisoExistente.estado = datosPermiso.estado ?? permisoExistente.estado;

    // Si se cambió el nombre o el rol, verificar que no exista otro permiso con la misma combinación
    if (datosPermiso.nombre || rol_id) {
      const nombreFinal = datosPermiso.nombre ?? permisoExistente.nombre;
      const rolFinal = rol_id ? await this.rolRepository.findOneBy({ id_rol: rol_id }) : permisoExistente.rol_id;
      
      // Verificar que rolFinal no sea null (aunque ya se validó arriba)
      if (!rolFinal) {
        throw new NotFoundException(`Error interno: No se pudo obtener el rol`);
      }
      
      const permisoConflicto = await this.permisoRepository.findOne({
        where: {
          nombre: nombreFinal,
          rol_id: { id_rol: rolFinal.id_rol },
          id_permiso: Not(id), // Excluir el permiso actual
        },
      });

      if (permisoConflicto) {
        // Si existe un conflicto, combinar los módulos y eliminar el permiso conflictivo
        const todosLosModulos = new Set<number>();
        
        // Agregar módulos del permiso actual
        if (permisoExistente.modulo_id && Array.isArray(permisoExistente.modulo_id)) {
          permisoExistente.modulo_id.forEach(modId => todosLosModulos.add(modId));
        }
        
        // Agregar módulos del permiso conflictivo
        if (permisoConflicto.modulo_id && Array.isArray(permisoConflicto.modulo_id)) {
          permisoConflicto.modulo_id.forEach(modId => todosLosModulos.add(modId));
        }
        
        // Si se enviaron nuevos módulos, también incluirlos
        if (modulosIds && Array.isArray(modulosIds)) {
          modulosIds.forEach(modId => todosLosModulos.add(modId));
        }
        
        // Actualizar el permiso actual con todos los módulos
        permisoExistente.modulo_id = Array.from(todosLosModulos);
        
        // Eliminar el permiso conflictivo
        await this.permisoRepository.delete(permisoConflicto.id_permiso);
      }
    }

    return this.permisoRepository.save(permisoExistente);
  }

  async remove(id: number): Promise<void> {
    const result = await this.permisoRepository.delete(id);
    if (result.affected === 0) {
      throw new NotFoundException(`Permiso con ID ${id} no encontrado`);
    }
  }

  /**
   * Limpia permisos duplicados por nombre y rol
   * Mantiene solo el más reciente y combina los módulos
   */
  async limpiarPermisosDuplicados(): Promise<{ eliminados: number, mensaje: string }> {
    // Obtener todos los permisos
    const todosLosPermisos = await this.permisoRepository.find({
      relations: ['rol_id'],
    });

    // Agrupar permisos por combinación nombre-rol
    const permisosPorGrupo = new Map<string, Permiso[]>();
    
    todosLosPermisos.forEach(permiso => {
      const clave = `${permiso.nombre}-${permiso.rol_id.id_rol}`;
      if (!permisosPorGrupo.has(clave)) {
        permisosPorGrupo.set(clave, []);
      }
      permisosPorGrupo.get(clave)!.push(permiso);
    });

    let eliminados = 0;
    const permisosAEliminar: number[] = [];

    // Para cada grupo de permisos duplicados
    for (const [clave, permisos] of permisosPorGrupo) {
      if (permisos.length > 1) {
        // Ordenar por fecha de creación (más reciente primero)
        permisos.sort((a, b) => new Date(b.fecha_creacion).getTime() - new Date(a.fecha_creacion).getTime());
        
        // Mantener el primero (más reciente) y eliminar los demás
        const [permisoAMantener, ...permisosParaEliminar] = permisos;
        
        // Combinar todos los módulos únicos
        const todosLosModulos = new Set<number>();
        permisos.forEach(p => {
          if (p.modulo_id && Array.isArray(p.modulo_id)) {
            p.modulo_id.forEach(modId => todosLosModulos.add(modId));
          } else if (typeof p.modulo_id === 'number') {
            // Manejar caso donde modulo_id es un solo número (datos antiguos)
            todosLosModulos.add(p.modulo_id);
          }
        });
        
        // Actualizar el permiso que se mantiene con todos los módulos
        permisoAMantener.modulo_id = Array.from(todosLosModulos);
        await this.permisoRepository.save(permisoAMantener);
        
        // Marcar los demás para eliminar
        permisosParaEliminar.forEach(permiso => {
          permisosAEliminar.push(permiso.id_permiso);
          eliminados++;
        });
      }
    }

    // Eliminar los permisos duplicados
    if (permisosAEliminar.length > 0) {
      await this.permisoRepository.delete(permisosAEliminar);
    }

    return {
      eliminados,
      mensaje: `Se eliminaron ${eliminados} permisos duplicados. Cada permiso ahora tiene todos los módulos combinados.`
    };
  }

  // Métodos para el super administrador
  
  /**
   * Verifica si un usuario es super administrador o administrador con permisos para gestionar permisos
   */
  async isSuperAdmin(usuarioId: number): Promise<boolean> {
    const usuario = await this.usuarioRepository.findOne({
      where: { id_usuario: usuarioId },
      relations: ['rol'],
    });
    
    if (!usuario || !usuario.rol) {
      return false;
    }
    
    // Permitir tanto al Super Administrador como al Administrador normal gestionar permisos
    const esSuperAdmin = usuario.rol.nombre_rol.toLowerCase() === 'super administrador';
    const esAdmin = usuario.rol.nombre_rol === 'Administrador';
    
    return esSuperAdmin || esAdmin;
  }

  /**
   * Obtiene todos los permisos de un rol específico
   */
  async getPermisosByRol(rolId: number): Promise<Permiso[]> {
    return this.permisoRepository.find({
      where: {
        rol_id: { id_rol: rolId },
      },
      relations: ['rol_id'],
    });
  }

  /**
   * Verifica si un usuario tiene un permiso específico para un módulo y acción
   * basado en su token JWT
   */
  async verificarPermiso(usuarioId: number, moduloNombre: string, accion: string): Promise<boolean> {
    const usuario = await this.usuarioRepository.findOne({
      where: { id_usuario: usuarioId },
      relations: ['rol'],
    });
    
    if (!usuario || !usuario.rol) {
      return false;
    }
    
    // Si es super administrador, tiene todos los permisos
    if (usuario.rol.nombre_rol === 'Super Administrador') {
      return true;
    }
    
    const modulo = await this.moduloRepository.findOne({
      where: { rutas: moduloNombre },
    });
    
    if (!modulo) {
      return false;
    }
    
    const permisos = await this.permisoRepository.find({
      where: {
        rol_id: { id_rol: usuario.rol.id_rol },
      },
      relations: ['rol_id'],
    });
    
    if (permisos.length === 0) {
      return false;
    }
    
    // Verificar si alguno de los permisos permite la acción
    for (const permiso of permisos) {
      if (Array.isArray(permiso.modulo_id) && permiso.modulo_id.includes(modulo.id_modulo)) {
        switch (accion) {
          case 'ver':
            if (permiso.puede_ver === true) return true;
            break;
          case 'crear':
            if (permiso.puede_crear === true) return true;
            break;
          case 'actualizar':
            if (permiso.puede_actualizar === true) return true;
            break;
        }
      }
    }
    
    return false;
  }

  /**
   * Obtiene todos los módulos/tablas con sus permisos para un rol específico
   * Útil para mostrar en la interfaz de administración de permisos
   */
  async getTablasConPermisos(rolId: number): Promise<any[]> {
    // Obtener todos los módulos
    const modulos = await this.moduloRepository.find();
    
    // Obtener todos los permisos para el rol especificado
    const permisos = await this.permisoRepository.find({
      where: {
        rol_id: { id_rol: rolId },
      },
      relations: ['rol_id'],
    });
    
    // Construir la respuesta con todos los módulos y sus permisos
    return modulos.map(modulo => {
      // Buscar si algún permiso incluye este módulo
      const permisoConModulo = permisos.find(permiso => 
        Array.isArray(permiso.modulo_id) && permiso.modulo_id.includes(modulo.id_modulo)
      );
      
      return {
        id_modulo: modulo.id_modulo,
        nombre: modulo.descripcion_ruta || modulo.rutas,
        ruta: modulo.rutas,
        permisos: permisoConModulo ? {
          id_permiso: permisoConModulo.id_permiso,
          puede_ver: permisoConModulo.puede_ver,
          puede_crear: permisoConModulo.puede_crear,
          puede_actualizar: permisoConModulo.puede_actualizar,
          estado: permisoConModulo.estado,
        } : {
          puede_ver: false,
          puede_crear: false,
          puede_actualizar: false,
          estado: false,
        }
      };
    });
  }
}
