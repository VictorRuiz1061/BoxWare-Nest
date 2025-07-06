import { Controller, Get, Post, Body, Put, Param,Delete, UseInterceptors, UploadedFile, BadRequestException,UseGuards,applyDecorators } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import * as XLSX from 'xlsx';

import { UsuariosService } from './usuarios.service';
import { CreateUsuarioDto } from './dto/create-usuario.dto';
import { UpdateUsuarioDto } from './dto/update-usuario.dto';

import { FileResponseInterceptor } from '../common/interceptors';
import { FileValidationPipe } from '../common/pipes';
import { ImagenesService } from '../common/services';
import { APP_CONSTANTS } from '../common/constants';
import { JwtAuthGuard } from '../common/guards';
import { PermissionGuard } from '../common/guards/permission.guard';
import { RequirePermiso } from '../common/decorators/permission.decorator';

@Controller('usuarios')
@UseGuards(JwtAuthGuard, PermissionGuard)
export class UsuariosController {
  constructor(
    private readonly usuariosService: UsuariosService,
    private readonly imagenesService: ImagenesService
  ) {}

  @Post()
  @UploadFile('imagen')
  @UseInterceptors(FileResponseInterceptor)
  @RequirePermiso('usuarios', 'crear')
  async create(
    @UploadedFile(new FileValidationPipe()) file: Express.Multer.File,
    @Body() createUsuarioDto: CreateUsuarioDto
  ) {
    try {
      const { cedula, email } = createUsuarioDto;

      const existingCedula = await this.usuariosService.findByCedula(cedula);
      if (existingCedula) {
        throw new BadRequestException(`La cédula ${cedula} ya está registrada.`);
      }

      const existingEmail = await this.usuariosService.findByEmail(email);
      if (existingEmail) {
        throw new BadRequestException(`El correo ${email} ya está registrado.`);
      }

      if (file) {
        const imageUrl = this.imagenesService.getImageUrl(
          file.filename,
          APP_CONSTANTS.IMAGES_BASE_URLS.USUARIOS
        );
        createUsuarioDto.imagen = imageUrl;
      }

      return await this.usuariosService.create(createUsuarioDto);
    } catch (error) {
      throw new BadRequestException('Error al crear el usuario: ' + error.message);
    }
  }

  @Post('carga-masiva')
  @UseInterceptors(FileInterceptor('archivo', {
    storage: memoryStorage(),
    fileFilter: (req, file, cb) => {
      const allowedMimetypes = [
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'application/vnd.ms-excel',
        'application/octet-stream'
      ];
      if (allowedMimetypes.includes(file.mimetype)) {
        return cb(null, true);
      }
      return cb(new Error('Solo se permiten archivos Excel (.xlsx, .xls)'), false);
    }
  }))
  @RequirePermiso('usuarios', 'crear')
  async cargaMasiva(
    @UploadedFile() file: Express.Multer.File,
    @Body('rol_id') rol_id: number
  ): Promise<{
    statusCode: number;
    message: string;
    timestamp: string;
    resumen: {
      total: number;
      creados: number;
      fallidos: number;
    };
    usuarios: ResultadoCarga[];
  }> {
    if (!file) {
      throw new BadRequestException('No se subió ningún archivo');
    }

    let worksheet: ExcelRow[] = [];

    try {
      const workbook = XLSX.read(file.buffer, { type: 'buffer' });
      const sheetName = workbook.SheetNames[0];
      worksheet = XLSX.utils.sheet_to_json<ExcelRow>(workbook.Sheets[sheetName]);

      if (worksheet.length === 0) {
        throw new BadRequestException('La hoja de Excel no contiene datos');
      }
    } catch (error) {
      throw new BadRequestException(`Error al procesar el archivo Excel: ${error.message}`);
    }

    const resultados: ResultadoCarga[] = [];

    const limpiarTexto = (texto: string) =>
      texto?.trim().toLowerCase().replace(/\s+/g, '_');

    for (const row of worksheet) {
      try {
        const { nombre, apellido, cedula } = row;

        if (!nombre || !apellido || !cedula) {
          throw new Error('Campos obligatorios faltantes en la fila');
        }

        const nombreLimpio = limpiarTexto(nombre);
        const apellidoLimpio = limpiarTexto(apellido);
        const email = row.email || `${nombreLimpio}_${apellidoLimpio}@correo.com`;

        const existentePorCedula = await this.usuariosService.findByCedula(cedula);
        if (existentePorCedula) {
          throw new Error(`El usuario con cédula ${cedula} ya está registrado`);
        }

        const existentePorEmail = await this.usuariosService.findByEmail(email);
        if (existentePorEmail) {
          throw new Error(`El usuario con correo ${email} ya está registrado`);
        }

        const contrasena = `${nombre.charAt(0)}${cedula}`;

        const createUsuarioDto: CreateUsuarioDto = {
          nombre,
          apellido,
          cedula,
          edad: row.edad || 18,
          email,
          telefono: row.telefono || '0000000000',
          contrasena,
          estado: true,
          rol_id: rol_id || 2,
          imagen: '',
        };

        const usuarioCreado = await this.usuariosService.create(createUsuarioDto);

        resultados.push({
          cedula,
          nombre,
          apellido,
          email,
          status: 'creado',
          id: usuarioCreado.id_usuario
        });
      } catch (error: any) {
        resultados.push({
          cedula: row.cedula || 'Desconocido',
          status: 'error',
          mensaje: error.message
        });
      }
    }

    return {
      statusCode: 201,
      message: 'Carga masiva procesada exitosamente',
      timestamp: new Date().toISOString(),
      resumen: {
        total: resultados.length,
        creados: resultados.filter(r => r.status === 'creado').length,
        fallidos: resultados.filter(r => r.status === 'error').length
      },
      usuarios: resultados
    };
  }

  @Get()
  @RequirePermiso('usuarios', 'ver')
  findAll() {
    return this.usuariosService.findAll();
  }

  @Get(':id')
  @RequirePermiso('usuarios', 'ver')
  findOne(@Param('id') id: string) {
    return this.usuariosService.findOne(+id);
  }

  @Put(':id')
  @RequirePermiso('usuarios', 'actualizar')
  update(@Param('id') id: string, @Body() updateUsuarioDto: UpdateUsuarioDto) {
    return this.usuariosService.update(+id, updateUsuarioDto);
  }

  @Delete(':id')
  @RequirePermiso('usuarios', 'eliminar')
  remove(@Param('id') id: string) {
    return this.usuariosService.remove(+id);
  }
}

function UploadFile(fieldName: string) {
  return applyDecorators(
    UseInterceptors(FileInterceptor(fieldName))
  );
}

// ✅ Interfaces movidas fuera del método para evitar TS4055

interface ExcelRow {
  nombre: string;
  apellido: string;
  cedula: string;
  edad?: number;
  email?: string;
  telefono?: string;
  [key: string]: any;
}

interface ResultadoCarga {
  cedula: string;
  nombre?: string;
  apellido?: string;
  email?: string;
  status: 'creado' | 'error';
  id?: number;
  mensaje?: string;
}
