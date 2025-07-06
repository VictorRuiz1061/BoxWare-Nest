import { Injectable, CanActivate, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Permiso } from '../../permisos/entities/permiso.entity';
import { Usuario } from '../../usuarios/entities/usuario.entity';
import { Rol } from '../../roles/entities/role.entity';

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
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    // Obtener los metadatos del decorador
    const modulo = this.reflector.get<string>('modulo', context.getHandler());
    const accion = this.reflector.get<string>('accion', context.getHandler());
    
    console.log(`PermissionGuard - Verificando acceso para módulo: ${modulo}, acción: ${accion}`);
    
    // Si no hay requisitos de permiso específicos, verificamos si la ruta está protegida de otra manera
    if (!modulo || !accion) {
      console.log('PermissionGuard - No hay requisitos de permiso específicos, permitiendo acceso');
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

    console.log('Usuario encontrado:', {
      id: usuarioCompleto?.id_usuario,
      email: usuarioCompleto?.email,
      rol: usuarioCompleto?.rol?.nombre_rol,
      rol_id: usuarioCompleto?.rol?.id_rol
    });

    if (!usuarioCompleto || !usuarioCompleto.rol) {
      throw new UnauthorizedException('Usuario sin rol asignado');
    }

    // Verificar si es super administrador o administrador
    console.log(`Verificando rol: '${usuarioCompleto.rol.nombre_rol}' contra 'Super Administrador'`);
    if (usuarioCompleto.rol.nombre_rol.toLowerCase() === 'super administrador') {
      console.log('Es super administrador, acceso permitido');
      return true; // El super administrador tiene acceso a todo
    }
    
    // Si es un administrador y está intentando acceder a la gestión de permisos, permitirlo
    console.log(`Verificando si es administrador y módulo es permisos: ${usuarioCompleto.rol.nombre_rol === 'Administrador'} && ${modulo === 'permisos'}`);
    if (usuarioCompleto.rol.nombre_rol === 'Administrador' && modulo === 'permisos') {
      console.log('Es administrador accediendo a gestión de permisos, acceso permitido');
      return true; // El administrador puede gestionar permisos
    }

    console.log(`Verificando permisos para rol: ${usuarioCompleto.rol.nombre_rol}, módulo: ${modulo}, acción: ${accion}`);

    // Buscar el permiso para el rol y módulo específico
    const permisos = await this.permisoRepository.find({
      where: {
        rol_id: { id_rol: usuarioCompleto.rol.id_rol },
      },
      relations: ['modulo_id'],
    });
    
    console.log(`Permisos encontrados: ${permisos.length}`);
    
    // Verificar si hay permisos para este rol
    if (permisos.length === 0) {
      console.log('No se encontraron permisos para este rol');
      return false; // No tiene ningún permiso asignado
    }
    
    // Debug: mostrar permisos del usuario
    console.log('Permisos del usuario:', permisos.map(p => ({
      id: p.id_permiso,
      nombre: p.nombre,
      modulo: Array.isArray(p.modulo_id) ? `módulos: [${p.modulo_id.join(',')}]` : 'sin módulo',
      puede_ver: p.puede_ver,
      puede_crear: p.puede_crear,
      puede_actualizar: p.puede_actualizar,
    })));

    // Verificar permisos para la acción requerida
    for (const p of permisos) {
      if (!p.modulo_id || !Array.isArray(p.modulo_id)) continue;
      
      // Si alguno de los módulos del permiso contiene el módulo requerido
      const tieneModulo = p.modulo_id.includes(parseInt(modulo)) || 
                         p.modulo_id.some(modId => modId.toString() === modulo);
      
      console.log(`Verificando módulo: ${modulo} en ${p.modulo_id}, tieneModulo: ${tieneModulo}`);

      if (tieneModulo) {
        // Verificar la acción específica
        console.log(`Verificando permiso: ${JSON.stringify({
          puede_ver: p.puede_ver,
          puede_crear: p.puede_crear,
          puede_actualizar: p.puede_actualizar,
          accion_requerida: accion
        })}`);
        
        switch (accion) {
          case 'ver':
            if (p.puede_ver === true) {
              console.log('✓ Permiso concedido para VER');
              return true;
            }
            break;
          case 'crear':
            if (p.puede_crear === true) {
              console.log('✓ Permiso concedido para CREAR');
              return true;
            }
            break;
          case 'actualizar':
            if (p.puede_actualizar === true) {
              console.log('✓ Permiso concedido para ACTUALIZAR');
              return true;
            }
            break;
        }
      }
    }
    
    console.log('No tiene permisos para la acción solicitada');
    return false;
  }
}
