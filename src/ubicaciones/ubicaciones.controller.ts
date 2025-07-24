import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import { UbicacionesService } from './ubicaciones.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { PermissionGuard } from '../common/guards/permission.guard';
import { RequirePermiso } from '../common/decorators/permission.decorator';
import { UbicacionResponseDto } from './dto/ubicacion-response.dto';

@Controller('ubicaciones')
@UseGuards(JwtAuthGuard, PermissionGuard)
export class UbicacionesController {
  constructor(private readonly ubicacionesService: UbicacionesService) {}

  @Get('material/:id')
  @RequirePermiso('materiales', 'ver')
  async obtenerUbicacionMaterial(@Param('id') id: string): Promise<UbicacionResponseDto> {
    const materialId = parseInt(id, 10);
    return this.ubicacionesService.obtenerUbicacion(materialId);
  }

  @Get('estado/:estado')
  @RequirePermiso('materiales', 'ver')
  async obtenerMaterialesPorEstado(
    @Param('estado') estado: string,
    @Query('responsable') responsableId?: string,
    @Query('sitio') sitioId?: string
  ): Promise<UbicacionResponseDto[]> {
    const responsableIdNum = responsableId ? parseInt(responsableId, 10) : undefined;
    const sitioIdNum = sitioId ? parseInt(sitioId, 10) : undefined;
    
    return this.ubicacionesService.obtenerMaterialesPorEstado(
      estado,
      responsableIdNum,
      sitioIdNum
    );
  }
} 