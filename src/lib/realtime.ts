import { io, type Socket } from 'socket.io-client';

let socket: Socket | null = null;
let socketToken: string | null = null;

// Single shared connection for the whole app -- callers (the global
// deactivation watcher, the admin users list) just attach/detach their own
// listeners on whatever this returns rather than each owning a connection.
// Idempotent: calling it again with the same token returns the existing
// socket instead of reconnecting.
export function getRealtimeSocket(token: string): Socket {
  if (socket && socketToken === token) {
    return socket;
  }
  disconnectRealtimeSocket();
  socketToken = token;
  socket = io(`${import.meta.env.PUBLIC_API_URL}/realtime`, {
    auth: { token },
    transports: ['websocket'],
  });
  return socket;
}

export function disconnectRealtimeSocket(): void {
  socket?.disconnect();
  socket = null;
  socketToken = null;
}
