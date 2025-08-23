# Usa la imagen oficial de Node.js 20 en su versión Alpine, que es más ligera.
FROM node:20-alpine

# Establece el directorio de trabajo dentro del contenedor.
WORKDIR /app

# Copia los archivos package.json y package-lock.json (o yarn.lock) al directorio de trabajo.
# Esto permite que Docker cachee la capa de instalación de dependencias si estos archivos no cambian.
COPY package*.json ./

# Instala las dependencias del proyecto.
# Utiliza --force para evitar problemas de compatibilidad si los hay.
RUN npm install --force

# Copia el resto del código de la aplicación al directorio de trabajo.
COPY . .

# Construye la aplicación NestJS para producción.
RUN npm run build

# Expone el puerto en el que la aplicación NestJS escuchará las conexiones.
EXPOSE 3000

# Define el comando que se ejecutará cuando se inicie el contenedor.
# Inicia la aplicación NestJS en modo producción.
CMD ["npm", "run", "start:prod"]