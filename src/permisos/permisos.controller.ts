import { Controller, Get, Post, Body, Put, Param, Delete, UseGuards, Request, ForbiddenException } from '@nestjs/common';
import { PermisoService } from './permisos.service';
import { CreatePermisoDto } from './dto/create-permiso.dto';
import { UpdatePermisoDto } from './dto/update-permiso.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { PermissionGuard } from '../common/guards/permission.guard';
import { RequirePermiso } from '../common/decorators/permission.decorator';

@Controller('permisos')
@UseGuards(JwtAuthGuard)
export class PermisosController {
  constructor(private readonly permisosService: PermisoService) {}

  @Post()
  @UseGuards(PermissionGuard)
  @RequirePermiso('permisos', 'crear')
  create(@Body() dto: CreatePermisoDto) {
    return this.permisosService.create(dto);
  }

  @Get()
  @UseGuards(PermissionGuard)
  @RequirePermiso('permisos', 'ver')
  findAll() {
    return this.permisosService.findAll();
  }

  @Get(':id')
  @UseGuards(PermissionGuard)
  @RequirePermiso('permisos', 'ver')
  findOne(@Param('id') id: string) {
    return this.permisosService.findOne(+id);
  }

  @Put(':id')
  @UseGuards(PermissionGuard)
  @RequirePermiso('permisos', 'actualizar')
  update(@Param('id') id: string, @Body() updatePermisoDto: UpdatePermisoDto) {
    return this.permisosService.update(+id, updatePermisoDto);
  }

  @Delete(':id')
  @UseGuards(PermissionGuard)
  @RequirePermiso('permisos', 'actualizar')
  remove(@Param('id') id: string) {
    return this.permisosService.remove(+id);
  }

  /**
   * Obtiene todos los permisos de un rol específico
   */
  @Get('rol/:id')
  @UseGuards(PermissionGuard)
  @RequirePermiso('permisos', 'ver')
  async getPermisosByRol(@Param('id') id: string, @Request() req) {
    return this.permisosService.getPermisosByRol(+id);
  }

  /**
   * Verifica si un usuario tiene un permiso específico
   */
  @Post('verificar')
  async verificarPermiso(
    @Request() req,
    @Body() body: { modulo: string, accion: string }
  ) {
    const usuarioId = req.user.id_usuario;
    return this.permisosService.verificarPermiso(usuarioId, body.modulo, body.accion);
  }

  /**
   * Obtiene todos los módulos/tablas con sus permisos para un rol específico
   */
  @Get('tablas/:rolId')
  @UseGuards(PermissionGuard)
  @RequirePermiso('permisos', 'ver')
  async getTablasConPermisos(@Param('rolId') rolId: string, @Request() req) {
    return this.permisosService.getTablasConPermisos(+rolId);
  }

  /**
   * Limpia permisos duplicados por nombre y rol
   * Mantiene solo el más reciente y combina los módulos
   */
  @Post('limpiar-duplicados')
  @UseGuards(PermissionGuard)
  @RequirePermiso('permisos', 'actualizar')
  async limpiarPermisosDuplicados(@Request() req) {
    return this.permisosService.limpiarPermisosDuplicados();
  }
}
