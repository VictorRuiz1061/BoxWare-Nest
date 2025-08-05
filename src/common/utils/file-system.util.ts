import { existsSync, mkdirSync, writeFileSync } from 'fs';
import { join } from 'path';
import { APP_CONSTANTS } from '../constants/app.constants';

/**
 * Utilidades para el manejo del sistema de archivos
 */
export class FileSystemUtil {
  /**
   * Asegura que un directorio exista, creándolo si es necesario
   * @param path Ruta del directorio
   * @returns true si el directorio existe o se creó exitosamente
   */
  static ensureDirectoryExists(path: string): boolean {
    try {
      if (!existsSync(path)) {
        mkdirSync(path, { recursive: true });
        return true;
      } else {
        return true;
      }
      } catch (error) {
      return false;
    }
  }

  /**
   * Asegura que todos los directorios de imágenes existan
   * @returns true si todos los directorios se crearon exitosamente
   */
    static ensureImageDirectoriesExist(): boolean {
    
    const imagesPaths = [
      APP_CONSTANTS.IMAGES_PATHS.MATERIALES,
      APP_CONSTANTS.IMAGES_PATHS.USUARIOS
    ];

    let allSuccess = true;
    
    imagesPaths.forEach(path => {
      const fullPath = join(process.cwd(), path);
      const success = this.ensureDirectoryExists(fullPath);
      if (!success) {
        allSuccess = false;
      }
    });

    return allSuccess;
  }

  /**
   * Crea un archivo de prueba para verificar permisos de escritura
   * @param directory Ruta del directorio
   * @returns true si se pudo crear el archivo de prueba
   */
  static testWritePermissions(directory: string): boolean {
    try {
      const testFile = join(directory, '.test-write-permissions');
      writeFileSync(testFile, 'test');
      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * Obtiene la ruta completa de un directorio de imágenes
   * @param imageType Tipo de imagen ('MATERIALES' o 'USUARIOS')
   * @returns Ruta completa del directorio
   */
  static getImageDirectoryPath(imageType: 'MATERIALES' | 'USUARIOS'): string {
    const relativePath = APP_CONSTANTS.IMAGES_PATHS[imageType];
    return join(process.cwd(), relativePath);
  }
} 