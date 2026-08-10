import { io, Socket } from 'socket.io-client';
import { getWorkspaceId } from './api';
import { resolveSocketUrl } from './publicUrls';

let socket: Socket | null = null;

function authToken(): string {
  return localStorage.getItem('convosync_token') ?? '';
}

export function getSocket(): Socket {
  if (!socket) {
    const url = resolveSocketUrl();
    socket = io(url, {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 10,
      auth: { token: authToken() },
    });
    socket.on('connect', () => {
      // Refresh token on each connect (login / company switch).
      socket!.auth = { token: authToken() };
      const workspaceId = getWorkspaceId();
      if (workspaceId) socket?.emit('join-workspace', workspaceId);
    });
    socket.io.on('reconnect', () => {
      socket!.auth = { token: authToken() };
      const workspaceId = getWorkspaceId();
      if (workspaceId) socket?.emit('join-workspace', workspaceId);
    });
  }
  return socket;
}

export function connectSocket(workspaceId: string) {
  const s = getSocket();
  s.auth = { token: authToken() };
  s.emit('join-workspace', workspaceId);
  return s;
}

export function disconnectSocket() {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
}
