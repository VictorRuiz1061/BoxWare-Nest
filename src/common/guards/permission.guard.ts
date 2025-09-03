import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Permiso } from '../../permisos/entities/permiso.entity';
import { Usuario } from '../../usuarios/entities/usuario.entity';
import { Rol } from '../../roles/entities/role.entity';
import { Modulo } from '../../modulos/entities/modulo.entity';
import { IsArray } from 'class-validator';

@Injectable()
export class PermissionGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    @InjectRepository(Permiso)
    private permisoRepository: Repository<Permiso>,
    @InjectRepository(Usuario)
    private usuarioRepository: Repository<Usuario>,
    @InjectRepository(Rol)
    private rolRepository: Repository<Rol>,
    @InjectRepository(Modulo)
    private moduloRepository: Repository<Modulo>,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    // Obtener los metadatos del decorador
    const modulo = this.reflector.get<string>('modulo', context.getHandler());
    const accion = this.reflector.get<string>('accion', context.getHandler());

    // Si no hay requisitos de permiso específicos, verificamos si la ruta está protegida de otra manera
    if (!modulo || !accion) {
      // Aquí podríamos verificar otros tipos de protección
      // Por ahora, solo permitimos acceso si no hay requisitos de permiso
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const usuario = request.user;

    if (!usuario) {
      throw new UnauthorizedException('Usuario no autenticado');
    }

    // Buscar el usuario completo con su rol
    const usuarioCompleto = await this.usuarioRepository.findOne({
      where: { id_usuario: usuario.id_usuario },
      relations: ['rol'],
    });

    if (!usuarioCompleto || !usuarioCompleto.rol) {
      throw new UnauthorizedException('Usuario sin rol asignado');
    }

    // Verificar si es super administrador o administrador

    if (
      usuarioCompleto.rol.nombre_rol.toLowerCase() === 'super administrador'
    ) {
      return true; // El super administrador tiene acceso a todo
    }

    // Si es un administrador y está intentando acceder a la gestión de permisos, permitirlo
    if (
      usuarioCompleto.rol.nombre_rol === 'Administrador' &&
      modulo === 'permisos'
    ) {
      return true; // El administrador puede gestionar permisos
    }

    // Buscar el permiso para el rol y módulo específico
    const permisos = await this.permisoRepository.find({
      where: {
        rol_id: { id_rol: usuarioCompleto.rol.id_rol },
      },
      select: [
        'id_permiso',
        'nombre',
        'modulo_id',
        'puede_ver',
        'puede_crear',
        'puede_actualizar',
      ],
    });

    for (const permiso of permisos) {
      if (permiso.modulo_id && Array.isArray(permiso.modulo_id)) {
      } else {
      }
    }

    // Verificar si hay permisos para este rol
    if (permisos.length === 0) {
      return false; // No tiene ningún permiso asignado
    }

    // Debug: mostrar permisos del usuario

    // Verificar permisos para la acción requerida
    for (const p of permisos) {
      // Verificar si alguno de los módulos del permiso coincide con el módulo requerido

      // Normalizar el nombre del módulo para buscarlo como '/modulo'
      let moduloNombre = modulo;
      if (!moduloNombre.startsWith('/')) {
        moduloNombre = '/' + moduloNombre;
      }

      // Buscar el módulo por 'rutas' o 'descripcion_ruta' exactamente
      const moduloEntity = await this.moduloRepository.findOne({
        where: [{ rutas: moduloNombre }, { descripcion_ruta: moduloNombre }],
      });
      if (!moduloEntity) {
        return false;
      }
      const moduloId = moduloEntity.id_modulo;

      // Verificar que el ID del módulo sea válido y que el permiso tenga ese módulo
      // Debug: Mostrar el tipo y valor exacto de modulo_id

      // Debug: Mostrar el tipo y valor exacto de moduloId

      // Debug: Mostrar cada elemento del array si es array
      if (Array.isArray(p.modulo_id)) {
        p.modulo_id.forEach((modId, index) => {});
      }

      // Función para verificar si tiene módulo
      const verificarModulo = async (
        modId: string | number,
      ): Promise<boolean> => {
        const modIdNum = typeof modId === 'string' ? parseInt(modId) : modId;

        // Si ya tenemos moduloId, simplemente comparamos
        if (moduloId > 0) {
          return modIdNum === moduloId;
        }

        // Si no tenemos moduloId, buscamos el módulo en la base de datos
        const moduloEntity = await this.moduloRepository.findOne({
          where: { id_modulo: modIdNum },
        });

        return moduloEntity !== null;
      };

      // Verificar cada módulo en el array
      const tieneModulo = await Promise.all(
        p.modulo_id.map((modId) => verificarModulo(modId)),
      ).then((results) => results.some((result) => result));

      if (tieneModulo) {
        // Debug: Mostrar el permiso completo

        switch (accion) {
          case 'ver':
            if (p.puede_ver === true) {
              return true;
            }
            break;
          case 'crear':
            if (p.puede_crear === true) {
              return true;
            }
            break;
          case 'actualizar':
            if (p.puede_actualizar === true) {
              return true;
            }
            break;
        }
      }
    }

    return false;
  }
}
