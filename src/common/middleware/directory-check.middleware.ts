import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { FileSystemUtil } from '../utils/file-system.util';
import { APP_CONSTANTS } from '../constants/app.constants';

/**
 * Middleware para verificar que los directorios de imágenes existan
 */
@Injectable()
export class DirectoryCheckMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction) {
    // Solo verificar en requests que involucren subida de archivos
    if (req.method === 'POST' || req.method === 'PUT') {
      const hasFile = req.file || (req.files && Array.isArray(req.files) && req.files.length > 0);
      
      if (hasFile) {
        // Verificar que todos los directorios de imágenes existan
        const directoriesReady = FileSystemUtil.ensureImageDirectoriesExist();
        
        if (!directoriesReady) {
          console.error('❌ Error: Directorios de imágenes no disponibles');
          return res.status(500).json({
            error: 'Error interno del servidor: Directorios de imágenes no disponibles'
          });
        }
      }
    }
    
    next();
  }
} 