import { io, type Socket } from 'socket.io-client'

import { API_BASE_URL } from '@/lib/apiConfig'
import { getStoredToken } from '@/lib/authSession'

let socket: Socket | null = null

function socketUrl(): string {
  return API_BASE_URL.replace(/\/api\/?$/, '')
}

export function getSocket(): Socket {
  if (!socket) {
    socket = io(socketUrl(), {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 10,
      auth: { token: getStoredToken() ?? '' },
    })
    socket.on('connect', () => {
      socket!.auth = { token: getStoredToken() ?? '' }
    })
  }
  return socket
}

export function connectSocket(workspaceId: string): Socket {
  const s = getSocket()
  s.auth = { token: getStoredToken() ?? '' }
  s.emit('join-workspace', workspaceId)
  return s
}
