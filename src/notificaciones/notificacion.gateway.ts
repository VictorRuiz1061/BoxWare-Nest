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
  namespace: '/alertas'
})
export class AlertaGateway implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private logger: Logger = new Logger('AlertaGateway');
  private connectedClients: Map<string, Socket> = new Map();

  afterInit(server: Server) {
    this.logger.log('Gateway de Alertas inicializado');
  }

  handleConnection(client: Socket) {
    this.logger.log(`Cliente conectado: ${client.id}`);
    this.connectedClients.set(client.id, client);
    
    // Enviar mensaje de bienvenida
    client.emit('conexion_establecida', {
      mensaje: 'Conectado al sistema de alertas',
      timestamp: new Date().toISOString()
    });
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Cliente desconectado: ${client.id}`);
    this.connectedClients.delete(client.id);
  }

  @SubscribeMessage('suscribir_alertas')
  handleSuscribirAlertas(client: Socket, payload: any) {
    this.logger.log(`Cliente ${client.id} se suscribió a las alertas`);
    
    // Unir al cliente a la sala de alertas
    client.join('alertas_generales');
    
    // Si se especifica un rol, unir a la sala específica del rol
    if (payload.rol) {
      client.join(`alertas_rol_${payload.rol}`);
    }
    
    // Si se especifica un sitio, unir a la sala específica del sitio
    if (payload.sitio_id) {
      client.join(`alertas_sitio_${payload.sitio_id}`);
    }
    
    client.emit('suscripcion_exitosa', {
      mensaje: 'Suscripción a alertas exitosa',
      timestamp: new Date().toISOString()
    });
  }

  @SubscribeMessage('desuscribir_alertas')
  handleDesuscribirAlertas(client: Socket) {
    this.logger.log(`Cliente ${client.id} se desuscribió de las alertas`);
    
    // Salir de todas las salas conocidas
    const salas = ['alertas_generales', 'alertas_administradores'];
    salas.forEach(sala => {
      client.leave(sala);
    });
    
    // También salir de salas específicas si están unidas
    if (this.connectedClients.has(client.id)) {
      // Remover de la lista de clientes conectados
      this.connectedClients.delete(client.id);
    }
    
    client.emit('desuscripcion_exitosa', {
      mensaje: 'Desuscripción de alertas exitosa',
      timestamp: new Date().toISOString()
    });
  }

  @SubscribeMessage('marcar_alerta_leida')
  handleMarcarAlertaLeida(client: Socket, payload: { alerta_id: number }) {
    this.logger.log(`Cliente ${client.id} marcó la alerta ${payload.alerta_id} como leída`);
    
    // Emitir evento para actualizar el estado de la alerta en todos los clientes
    this.server.to('alertas_generales').emit('alerta_actualizada', {
      alerta_id: payload.alerta_id,
      estado: 'leida',
      timestamp: new Date().toISOString()
    });
  }

  // Método para enviar alertas a todos los clientes conectados
  async enviarAlerta(alerta: Notificacion) {
    this.logger.log(`Enviando alerta: ${alerta.titulo}`);
    
    const payload = {
      id: alerta.id_notificacion,
      tipo: alerta.tipo,
      nivel: alerta.nivel,
      titulo: alerta.titulo,
      mensaje: alerta.mensaje,
      datos_adicionales: alerta.datos_adicionales,
      material_id: alerta.material_id,
      sitio_id: alerta.sitio_id,
      movimiento_id: alerta.movimiento_id,
      usuario_id: alerta.usuario_id,
      fecha_creacion: alerta.fecha_creacion,
      timestamp: new Date().toISOString()
    };

    // Enviar a todos los clientes en la sala general
    this.server.to('alertas_generales').emit('nueva_alerta', payload);
    
    // Enviar a clientes específicos según el rol (si aplica)
    if (alerta.usuario_id) {
      this.server.to(`alertas_usuario_${alerta.usuario_id}`).emit('nueva_alerta', payload);
    }
    
    // Enviar a clientes específicos según el sitio (si aplica)
    if (alerta.sitio_id) {
      this.server.to(`alertas_sitio_${alerta.sitio_id}`).emit('nueva_alerta', payload);
    }
    
    // Marcar la alerta como enviada por WebSocket
    alerta.enviada_websocket = true;
  }

  // Método para enviar alertas específicas por tipo
  async enviarAlertaPorTipo(alerta: Notificacion, tipo: string) {
    this.server.to(`alertas_tipo_${tipo}`).emit('nueva_alerta', {
      id: alerta.id_notificacion,
      tipo: alerta.tipo,
      nivel: alerta.nivel,
      titulo: alerta.titulo,
      mensaje: alerta.mensaje,
      datos_adicionales: alerta.datos_adicionales,
      timestamp: new Date().toISOString()
    });
  }

  // Método para enviar alertas críticas a administradores
  async enviarAlertaCritica(alerta: Notificacion) {
    this.server.to('alertas_administradores').emit('alerta_critica', {
      id: alerta.id_notificacion,
      tipo: alerta.tipo,
      nivel: alerta.nivel,
      titulo: alerta.titulo,
      mensaje: alerta.mensaje,
      datos_adicionales: alerta.datos_adicionales,
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
    this.server.to('alertas_generales').emit('notificacion_sistema', {
      mensaje,
      tipo,
      timestamp: new Date().toISOString()
    });
  }
} 