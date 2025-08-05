import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  OnGatewayInit,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger } from '@nestjs/common';
import { Notificacion } from './entities/notificacion.entity';

@WebSocketGateway({
  cors: {
    origin: "*", // En producción, especifica el dominio de tu frontend
    methods: ["GET", "POST"]
  },
  namespace: '/Notificacion'
})
export class NotificacionGateway implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private logger: Logger = new Logger('NotificacionGateway');
  private connectedClients: Map<string, Socket> = new Map();

  afterInit(server: Server) {
    this.logger.log('Gateway de Notificacion inicializado');
  }

  handleConnection(client: Socket) {
    this.logger.log(`Cliente conectado: ${client.id}`);
    this.connectedClients.set(client.id, client);
    
    // Enviar mensaje de bienvenida
    client.emit('conexion_establecida', {
      mensaje: 'Conectado al sistema de Notificacion',
      timestamp: new Date().toISOString()
    });
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Cliente desconectado: ${client.id}`);
    this.connectedClients.delete(client.id);
  }

  @SubscribeMessage('suscribir_Notificacions')
  handleSuscribirNotificacions(client: Socket, payload: any) {
    this.logger.log(`Cliente ${client.id} se suscribió a las Notificacion`);
    
    // Unir al cliente a la sala de Notificacion
    client.join('Notificacions_generales');
    
    // Si se especifica un rol, unir a la sala específica del rol
    if (payload.rol) {
      client.join(`Notificacions_rol_${payload.rol}`);
    }
    
    // Si se especifica un sitio, unir a la sala específica del sitio
    if (payload.sitio_id) {
      client.join(`Notificacions_sitio_${payload.sitio_id}`);
    }
    
    client.emit('suscripcion_exitosa', {
      mensaje: 'Suscripción a Notificacion exitosa',
      timestamp: new Date().toISOString()
    });
  }

  @SubscribeMessage('desuscribir_Notificacions')
  handleDesuscribirNotificacions(client: Socket) {
    this.logger.log(`Cliente ${client.id} se desuscribió de las Notificacion`);
    
    // Salir de todas las salas conocidas
    const salas = ['Notificacions_generales', 'Notificacions_administradores'];
    salas.forEach(sala => {
      client.leave(sala);
    });
    
    // También salir de salas específicas si están unidas
    if (this.connectedClients.has(client.id)) {
      // Remover de la lista de clientes conectados
      this.connectedClients.delete(client.id);
    }
    
    client.emit('desuscripcion_exitosa', {
      mensaje: 'Desuscripción de Notificacion exitosa',
      timestamp: new Date().toISOString()
    });
  }

  @SubscribeMessage('marcar_Notificacion_leida')
  handleMarcarNotificacionLeida(client: Socket, payload: { Notificacion_id: number }) {
    this.logger.log(`Cliente ${client.id} marcó la Notificacion ${payload.Notificacion_id} como leída`);
    
    // Emitir evento para actualizar el estado de la Notificacion en todos los clientes
    this.server.to('Notificacions_generales').emit('Notificacion_actualizada', {
      Notificacion_id: payload.Notificacion_id,
      estado: 'leida',
      timestamp: new Date().toISOString()
    });
  }

  // Método para enviar Notificacion a todos los clientes conectados
  async enviarNotificacion(Notificacion: Notificacion) {
    this.logger.log(`Enviando Notificacion: ${Notificacion.titulo}`);
    
    const payload = {
      id: Notificacion.id_notificacion,
      tipo: Notificacion.tipo,
      nivel: Notificacion.nivel,
      titulo: Notificacion.titulo,
      mensaje: Notificacion.mensaje,
      datos_adicionales: Notificacion.datos_adicionales,
      material_id: Notificacion.material_id,
      sitio_id: Notificacion.sitio_id,
      movimiento_id: Notificacion.movimiento_id,
      usuario_id: Notificacion.usuario_id,
      fecha_creacion: Notificacion.fecha_creacion,
      timestamp: new Date().toISOString()
    };

    // Enviar a todos los clientes en la sala general
    this.server.to('Notificacions_generales').emit('nueva_Notificacion', payload);
    
    // Enviar a clientes específicos según el rol (si aplica)
    if (Notificacion.usuario_id) {
      this.server.to(`Notificacions_usuario_${Notificacion.usuario_id}`).emit('nueva_Notificacion', payload);
    }
    
    // Enviar a clientes específicos según el sitio (si aplica)
    if (Notificacion.sitio_id) {
      this.server.to(`Notificacions_sitio_${Notificacion.sitio_id}`).emit('nueva_Notificacion', payload);
    }
    
    // Marcar la Notificacion como enviada por WebSocket
    Notificacion.enviada_websocket = true;
  }

  // Método para enviar Notificacion específicas por tipo
  async enviarNotificacionPorTipo(Notificacion: Notificacion, tipo: string) {
    this.server.to(`Notificacions_tipo_${tipo}`).emit('nueva_Notificacion', {
      id: Notificacion.id_notificacion,
      tipo: Notificacion.tipo,
      nivel: Notificacion.nivel,
      titulo: Notificacion.titulo,
      mensaje: Notificacion.mensaje,
      datos_adicionales: Notificacion.datos_adicionales,
      timestamp: new Date().toISOString()
    });
  }

  // Método para enviar Notificacion críticas a administradores
  async enviarNotificacionCritica(Notificacion: Notificacion) {
    this.server.to('Notificaciones_administradores').emit('Notificacion_critica', {
      id: Notificacion.id_notificacion,
      tipo: Notificacion.tipo,
      nivel: Notificacion.nivel,
      titulo: Notificacion.titulo,
      mensaje: Notificacion.mensaje,
      datos_adicionales: Notificacion.datos_adicionales,
      timestamp: new Date().toISOString()
    });
  }

  // Método para obtener estadísticas de conexiones
  obtenerEstadisticasConexiones() {
    return {
      clientes_conectados: this.connectedClients.size,
      salas_activas: Array.from(this.server.sockets.adapter.rooms.keys()),
      timestamp: new Date().toISOString()
    };
  }

  // Método para enviar notificación de sistema
  enviarNotificacionSistema(mensaje: string, tipo: 'info' | 'warning' | 'error' = 'info') {
    this.server.to('Notificaciones_generales').emit('notificacion_sistema', {
      mensaje,
      tipo,
      timestamp: new Date().toISOString()
    });
  }
} 