let ioInstance = null;

const initSocket = (server, corsOrigin = '*') => {
  const { Server } = require('socket.io');
  ioInstance = new Server(server, {
    cors: {
      origin: corsOrigin,
      methods: ['GET', 'POST', 'PUT', 'DELETE'],
      credentials: true
    }
  });

  ioInstance.on('connection', (socket) => {
    console.log(`🔌 Client connected to WebSocket: ${socket.id}`);

    // Join room based on doctor and date to receive targeted updates
    socket.on('join_schedule_room', ({ doctorId, date }) => {
      if (doctorId && date) {
        const room = `schedule_${doctorId}_${date}`;
        socket.join(room);
        console.log(`📡 Socket ${socket.id} joined room: ${room}`);
      }
    });

    socket.on('leave_schedule_room', ({ doctorId, date }) => {
      if (doctorId && date) {
        const room = `schedule_${doctorId}_${date}`;
        socket.leave(room);
        console.log(`📡 Socket ${socket.id} left room: ${room}`);
      }
    });

    socket.on('disconnect', () => {
      console.log(`🔌 Client disconnected from WebSocket: ${socket.id}`);
    });
  });

  return ioInstance;
};

const getIO = () => {
  return ioInstance;
};

/**
 * Broadcast event both to the specific schedule room and globally
 */
const emitAppointmentUpdate = (action, appointment) => {
  if (!ioInstance) return;

  const payload = {
    action, // 'CREATED', 'UPDATED', 'CANCELLED', 'ARRIVED'
    appointment
  };

  // Broadcast globally so dashboards update
  ioInstance.emit('appointment_event', payload);

  // Broadcast specifically to the targeted doctor & date room
  if (appointment.doctor && appointment.date) {
    const doctorId = appointment.doctor._id ? appointment.doctor._id.toString() : appointment.doctor.toString();
    const room = `schedule_${doctorId}_${appointment.date}`;
    ioInstance.to(room).emit('slot_status_changed', payload);
  }
};

module.exports = {
  initSocket,
  getIO,
  emitAppointmentUpdate
};
