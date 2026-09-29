import { createContext, useContext, useEffect, useState } from 'react'
import { io } from 'socket.io-client'
import { HubConnectionBuilder, LogLevel } from '@microsoft/signalr'
import { useAuth } from './AuthContext'

const SocketContext = createContext(null)

// backend-c# đẩy thông báo qua SignalR, backend-nodejs qua Socket.io — chọn theo VITE_REALTIME
const useSignalR = import.meta.env.VITE_REALTIME === 'signalr'
const socketUrl = import.meta.env.VITE_SOCKET_URL || (import.meta.env.DEV ? 'http://localhost:4000' : '')
const hubUrl = `${import.meta.env.VITE_API_URL || ''}/hubs/notifications`

// Bọc HubConnection lại thành đúng kiểu on/off của socket.io để Navbar, Notifications không phải sửa.
// Riêng sự kiện 'connect' (socket.io tự phát) thì tự phát lại khi SignalR kết nối/kết nối lại thành công.
function createSignalRSocket(token) {
  const connection = new HubConnectionBuilder()
    .withUrl(hubUrl, { accessTokenFactory: () => token, withCredentials: false })
    .withAutomaticReconnect()
    .configureLogging(LogLevel.Warning)
    .build()

  const connectListeners = new Set()
  const emitConnect = () => connectListeners.forEach(fn => fn())
  connection.onreconnected(emitConnect)

  let stopped = false
  connection.start().then(emitConnect).catch(() => {
    if (!stopped) console.warn('Không kết nối được SignalR, thông báo sẽ cập nhật theo chu kỳ')
  })

  return {
    on(event, fn) {
      if (event === 'connect') connectListeners.add(fn)
      else connection.on(event, fn)
    },
    off(event, fn) {
      if (event === 'connect') connectListeners.delete(fn)
      else connection.off(event, fn)
    },
    disconnect() {
      stopped = true
      connection.stop()
    },
  }
}

export function SocketProvider({ children }) {
  const { token } = useAuth()
  const [socket, setSocket] = useState(null)

  useEffect(() => {
    if (!token) {
      setSocket(null)
      return
    }

    const instance = useSignalR ? createSignalRSocket(token) : io(socketUrl, { auth: { token } })
    setSocket(instance)

    return () => {
      instance.disconnect()
      setSocket(null)
    }
  }, [token])

  return <SocketContext.Provider value={{ socket }}>{children}</SocketContext.Provider>
}

export function useSocket() {
  return useContext(SocketContext)
}
