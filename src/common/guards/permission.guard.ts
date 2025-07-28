import { Injectable, CanActivate, ExecutionContext, UnauthorizedException } from '@nestjs/common';
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
      select: ['id_permiso', 'nombre', 'modulo_id', 'puede_ver', 'puede_crear', 'puede_actualizar']
    });
    
    for (const permiso of permisos) {
      console.log(`Permiso encontrado: ${permiso.nombre} (ID: ${permiso.id_permiso})`);
      if (permiso.modulo_id && Array.isArray(permiso.modulo_id)) {
        console.log(`Módulos asociados: ${permiso.modulo_id.join(', ')}`);
      } else {
        console.log('No tiene módulos asociados');
      }
    }
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
      // Verificar si alguno de los módulos del permiso coincide con el módulo requerido
    console.log(`Buscando módulo con rutas o descripción_ruta: ${modulo}`);
    
    // Normalizar el nombre del módulo para buscarlo como '/modulo'
    let moduloNombre = modulo;
    if (!moduloNombre.startsWith('/')) {
      moduloNombre = '/' + moduloNombre;
    }

    // Buscar el módulo por 'rutas' o 'descripcion_ruta' exactamente
    const moduloEntity = await this.moduloRepository.findOne({
      where: [
        { rutas: moduloNombre },
        { descripcion_ruta: moduloNombre }
      ]
    });
    if (!moduloEntity) {
      console.log(`No se encontró el módulo '${moduloNombre}' en la base de datos. Denegando acceso.`);
      return false;
    }
    const moduloId = moduloEntity.id_modulo;
    
    console.log(`ID del módulo '${modulo}': ${moduloId}`);

    // Verificar que el ID del módulo sea válido y que el permiso tenga ese módulo
    // Debug: Mostrar el tipo y valor exacto de modulo_id
    console.log(`Tipo de modulo_id: ${typeof p.modulo_id}`);
    console.log(`Valor de modulo_id:`, p.modulo_id);
    
    // Debug: Mostrar el tipo y valor exacto de moduloId
    console.log(`Tipo de moduloId: ${typeof moduloId}`);
    console.log(`Valor de moduloId: ${moduloId}`);
    
    // Debug: Mostrar cada elemento del array si es array
    if (Array.isArray(p.modulo_id)) {
      console.log('Elementos del array modulo_id:');
      p.modulo_id.forEach((modId, index) => {
        console.log(`Elemento ${index}:`, modId, `Tipo: ${typeof modId}`);
      });
    }
    
    // Función para verificar si tiene módulo
    const verificarModulo = async (modId: string | number): Promise<boolean> => {
      const modIdNum = typeof modId === 'string' ? parseInt(modId) : modId;
      console.log(`Verificando módulo con ID: ${modIdNum} (${typeof modId})`);
      
      // Si ya tenemos moduloId, simplemente comparamos
      if (moduloId > 0) {
        return modIdNum === moduloId;
      }
      
      // Si no tenemos moduloId, buscamos el módulo en la base de datos
      const moduloEntity = await this.moduloRepository.findOne({
        where: { id_modulo: modIdNum }
      });
      
      return moduloEntity !== null;
    };

    // Verificar cada módulo en el array
    const tieneModulo = await Promise.all(
      p.modulo_id.map(modId => verificarModulo(modId))
    ).then(results => results.some(result => result));
      
    console.log(`Verificando módulo: ${modulo} (ID: ${moduloId}) en ${p.modulo_id}, tieneModulo: ${tieneModulo}`);

      if (tieneModulo) {
        // Debug: Mostrar el permiso completo
        console.log('Permiso encontrado:', {
          id: p.id_permiso,
          nombre: p.nombre,
          modulo_id: p.modulo_id,
          puede_ver: p.puede_ver,
          puede_crear: p.puede_crear,
          puede_actualizar: p.puede_actualizar
        });
        
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