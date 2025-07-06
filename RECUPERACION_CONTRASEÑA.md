# Recuperación de Contraseña - BoxWare

## Descripción

Se ha implementado un sistema de recuperación de contraseña que envía un código de 6 dígitos al correo electrónico del usuario para verificar su identidad antes de permitir el cambio de contraseña.

## Funcionalidades

### 1. Solicitar Recuperación de Contraseña
- **Endpoint**: `POST /recuperar`
- **Body**:
```json
{
  "email": "usuario@ejemplo.com"
}
```
- **Respuesta**:
```json
{
  "message": "Código de verificación enviado al correo electrónico",
  "email": "usuario@ejemplo.com"
}
```

### 2. Verificar Código
- **Endpoint**: `POST /verificar-codigo`
- **Body**:
```json
{
  "email": "usuario@ejemplo.com",
  "codigo": "123456"
}
```
- **Respuesta**:
```json
{
  "message": "Código verificado correctamente",
  "token": "jwt_token_temporal"
}
```

### 3. Cambiar Contraseña
- **Endpoint**: `POST /restablecer`
- **Body**:
```json
{
  "email": "usuario@ejemplo.com",
  "codigo": "123456",
  "nuevaContrasena": "nueva_contraseña123"
}
```
- **Respuesta**:
```json
{
  "message": "Contraseña actualizada exitosamente"
}
```

## Configuración de Correo Electrónico

### 1. Variables de Entorno

Agrega las siguientes variables a tu archivo `.env`:

```env
# Configuración de correo electrónico
EMAIL_USER=tu-email@gmail.com
EMAIL_PASSWORD=tu-password-de-aplicacion
```

### 2. Configuración de Gmail

Para usar Gmail como proveedor de correo:

1. **Habilitar verificación en dos pasos** en tu cuenta de Google
2. **Generar contraseña de aplicación**:
   - Ve a Configuración de tu cuenta de Google
   - Seguridad > Verificación en dos pasos
   - Contraseñas de aplicación
   - Genera una nueva contraseña para "Correo"
3. **Usar la contraseña generada** en `EMAIL_PASSWORD`

### 3. Otros Proveedores

Si quieres usar otro proveedor de correo, modifica la configuración en `src/common/services/email.service.ts`:

```typescript
// Para Outlook/Hotmail
this.transporter = nodemailer.createTransporter({
  service: 'outlook',
  auth: {
    user: 'tu-email@outlook.com',
    pass: 'tu-password'
  }
});

// Para Yahoo
this.transporter = nodemailer.createTransporter({
  service: 'yahoo',
  auth: {
    user: 'tu-email@yahoo.com',
    pass: 'tu-password'
  }
});

// Para servidor SMTP personalizado
this.transporter = nodemailer.createTransporter({
  host: 'smtp.tuservidor.com',
  port: 587,
  secure: false,
  auth: {
    user: 'tu-email@tuservidor.com',
    pass: 'tu-password'
  }
});
```

## Características de Seguridad

### Código de Verificación
- **Longitud**: 6 dígitos numéricos
- **Expiración**: 15 minutos
- **Uso único**: Se elimina después de ser usado
- **Limpieza automática**: Los códigos expirados se eliminan automáticamente

### Token Temporal
- **Duración**: 5 minutos
- **Propósito específico**: Solo para cambio de contraseña
- **Validación**: Verifica que el token sea del tipo correcto

### Validaciones
- Verificación de existencia del usuario
- Validación de formato de correo electrónico
- Validación de longitud de contraseña (6-50 caracteres)
- Manejo de errores específicos

## Flujo de Uso

1. **Usuario solicita recuperación**: Envía su correo electrónico
2. **Sistema envía código**: Genera y envía código de 6 dígitos por correo
3. **Usuario verifica código**: Introduce el código recibido
4. **Sistema valida**: Verifica el código y genera token temporal
5. **Usuario cambia contraseña**: Introduce nueva contraseña con código
6. **Sistema actualiza**: Cambia la contraseña y confirma

## Notas Importantes

- **En producción**: Considera usar Redis para almacenar los códigos de verificación
- **Logs**: El sistema registra todas las operaciones para auditoría
- **Plantilla de correo**: Incluye diseño responsive y branding de BoxWare
- **Manejo de errores**: Proporciona mensajes claros para diferentes tipos de errores

## Pruebas

Para probar la funcionalidad:

1. Asegúrate de tener configurado el correo electrónico
2. Usa un correo válido registrado en la base de datos
3. Revisa la bandeja de entrada (y spam) para el código
4. Sigue el flujo completo de recuperación

## Solución de Problemas

### Error de autenticación de correo
- Verifica que las credenciales sean correctas
- Asegúrate de usar contraseña de aplicación para Gmail
- Revisa que el correo tenga habilitada la verificación en dos pasos

### Código no recibido
- Revisa la carpeta de spam
- Verifica que el correo esté registrado en la base de datos
- Revisa los logs del servidor para errores de envío

### Código expirado
- Los códigos expiran en 15 minutos
- Solicita un nuevo código si el anterior expiró
- Verifica la hora del servidor 