import { Controller, Get, Post, Body, Put, Param, Delete,
  UseInterceptors, UploadedFile, BadRequestException, UseGuards } from '@nestjs/common';
import { MaterialesService } from './materiales.service';
import { CreateMaterialeDto } from './dto/create-materiale.dto';
import { UpdateMaterialeDto } from './dto/update-materiale.dto';

import { FileResponseInterceptor } from '../common/interceptors';
import { FileValidationPipe } from '../common/pipes';
import { ImagenesService } from '../common/services';
import { APP_CONSTANTS } from '../common/constants';
import { JwtAuthGuard } from '../common/guards';
import { PermissionGuard } from '../common/guards/permission.guard';
import { RequirePermiso } from '../common/decorators/permission.decorator';

// ✅ Importar decorador personalizado
import { UploadFile } from '../common/decorators/upload-file.decorator';

@Controller('materiales')
@UseGuards(JwtAuthGuard, PermissionGuard)
export class MaterialesController {
  constructor(
    private readonly materialesService: MaterialesService,
    private readonly imagenesService: ImagenesService
  ) {}

  @Post()
  @RequirePermiso('materiales', 'crear')
  @UploadFile('imagen')
  @UseInterceptors(FileResponseInterceptor)
  async create(
    @UploadedFile(new FileValidationPipe()) file: Express.Multer.File,
    @Body() createMaterialeDto: CreateMaterialeDto,
  ) {
    try {
      // Si hay un archivo, usar la URL generada
      if (file) {
        const imageUrl = this.imagenesService.getImageUrl(
          file.filename,
          APP_CONSTANTS.IMAGES_BASE_URLS.MATERIALES
        );
        createMaterialeDto.imagen = imageUrl;
      }
      
      // Si no hay archivo pero hay una URL de imagen en el DTO, usarla
      // Esto permite que el frontend envíe directamente una URL de imagen
      // que ya fue subida previamente con el endpoint upload-image
      
      console.log('Creando material con datos (antes de transformación):', JSON.stringify(createMaterialeDto));
      
      // Asegurar que los tipos sean correctos
      if (typeof createMaterialeDto.categoria_id === 'string') {
        createMaterialeDto.categoria_id = Number(createMaterialeDto.categoria_id);
      }
      
      if (typeof createMaterialeDto.tipo_material_id === 'string') {
        createMaterialeDto.tipo_material_id = Number(createMaterialeDto.tipo_material_id);
      }
      
      if (typeof createMaterialeDto.producto_perecedero === 'string') {
        createMaterialeDto.producto_perecedero = createMaterialeDto.producto_perecedero === 'true';
      }
      
      if (typeof createMaterialeDto.estado === 'string') {
        createMaterialeDto.estado = createMaterialeDto.estado === 'true';
      }
      
      console.log('Creando material con datos (después de transformación):', JSON.stringify(createMaterialeDto));
      
      // Validar que todos los campos requeridos estén presentes
      const requiredFields = ['codigo_sena', 'nombre_material', 'descripcion_material', 
                             'unidad_medida', 'categoria_id', 'tipo_material_id'];
      
      for (const field of requiredFields) {
        if (createMaterialeDto[field] === undefined || createMaterialeDto[field] === null) {
          console.error(`Campo requerido faltante: ${field}`);
          throw new BadRequestException(`Campo requerido faltante: ${field}`);
        }
      }
      
      return await this.materialesService.create(createMaterialeDto);
    } catch (error) {
      console.error('Error al crear material:', JSON.stringify(error));
      
      // Mostrar el mensaje de error completo
      if (error instanceof BadRequestException) {
        throw error;
      } else if (error.response) {
        console.error('Error detallado:', JSON.stringify(error.response));
        throw new BadRequestException({
          message: 'Error al crear el material',
          error: error.response
        });
      } else {
        throw new BadRequestException({
          message: 'Error al crear el material',
          error: error.message || error
        });
      }
    }
  }

  @Get()
  @RequirePermiso('materiales', 'ver')
  findAll() {
    return this.materialesService.findAll();
  }

  @Get(':id')
  @RequirePermiso('materiales', 'ver')
  findOne(@Param('id') id: string) {
    return this.materialesService.findOne(+id);
  }

  @Put(':id')
  @RequirePermiso('materiales', 'actualizar')
  @UploadFile('imagen')
  @UseInterceptors(FileResponseInterceptor)
  async update(
    @Param('id') id: string, 
    @UploadedFile(new FileValidationPipe()) file: Express.Multer.File,
    @Body() updateMaterialeDto: UpdateMaterialeDto
  ) {
    try {
      if (file) {
        const imageUrl = this.imagenesService.getImageUrl(
          file.filename,
          APP_CONSTANTS.IMAGES_BASE_URLS.MATERIALES
        );
        updateMaterialeDto.imagen = imageUrl;
      }

      return await this.materialesService.update(+id, updateMaterialeDto);
    } catch (error) {
      throw new BadRequestException('Error al actualizar el material: ' + error.message);
    }
  }

  @Delete(':id')
  @RequirePermiso('materiales', 'actualizar')
  remove(@Param('id') id: string) {
    return this.materialesService.remove(+id);
  }

  /**
   * Endpoint específico para subir imágenes de materiales
   * @param file Archivo de imagen
   * @returns URL de la imagen subida
   */
  @Post('upload-image')
  @RequirePermiso('materiales', 'crear')
  @UploadFile('imagen')
  @UseInterceptors(FileResponseInterceptor)
  async uploadImage(@UploadedFile(new FileValidationPipe()) file: Express.Multer.File) {
    try {
      if (!file) {
        throw new BadRequestException('No se ha proporcionado ningún archivo');
      }

      const imageUrl = this.imagenesService.getImageUrl(
        file.filename,
        APP_CONSTANTS.IMAGES_BASE_URLS.MATERIALES
      );

      return { imageUrl };
    } catch (error) {
      throw new BadRequestException('Error al subir la imagen: ' + error.message);
    }
  }

  /**
   * Endpoint para actualizar el stock de un material
   * @param id ID del material
   * @param datos Datos para actualizar el stock
   * @returns Resultado de la operación
   */
  @Post(':id/actualizar-stock')
  @RequirePermiso('materiales', 'actualizar')
  actualizarStock(
    @Param('id') id: string, 
    @Body() datos: {
      sitio_id: number;
      cantidad: number;
      placa_sena?: string;
      descripcion?: string;
    }
  ) {
    return this.materialesService.actualizarStockMaterial(
      +id, 
      datos.sitio_id, 
      datos.cantidad,
      datos.placa_sena,
      datos.descripcion
    );
  }
}
