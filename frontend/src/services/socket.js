import { io } from 'socket.io-client';

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000';

let socket = null;

export const getSocket = () => {
  if (!socket) {
    socket = io(SOCKET_URL, {
      autoConnect: true,
      transports: ['websocket', 'polling']
    });

    socket.on('connect', () => {
      console.log('⚡ Connected to EMR Real-time WebSocket Gateway:', socket.id);
    });

    socket.on('disconnect', () => {
      console.log('❌ Disconnected from WebSocket Gateway');
    });
  }
  return socket;
};
