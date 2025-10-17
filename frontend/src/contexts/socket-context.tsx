'use client'

import React, { createContext, useContext, useEffect, useState, useRef } from 'react'
import { io, Socket } from 'socket.io-client'
import { useAuth } from '@/contexts/auth-context'
import { toast } from 'sonner'

interface SocketContextType {
  socket: Socket | null
  isConnected: boolean
  onlineUsers: string[]
  sendMessage: (content: string, type?: 'GENERAL' | 'DIRECT', receiverId?: string) => void
  joinRoom: (room: string) => void
  leaveRoom: (room: string) => void
}

const SocketContext = createContext<SocketContextType | null>(null)

export function useSocket() {
  const context = useContext(SocketContext)
  if (!context) {
    throw new Error('useSocket must be used within a SocketProvider')
  }
  return context
}

interface SocketProviderProps {
  children: React.ReactNode
}

export default function SocketProvider({ children }: SocketProviderProps) {
  const [socket, setSocket] = useState<Socket | null>(null)
  const [isConnected, setIsConnected] = useState(false)
  const [onlineUsers, setOnlineUsers] = useState<string[]>([])
  const { user, token } = useAuth()
  const reconnectTimeoutRef = useRef<NodeJS.Timeout>()

  useEffect(() => {
    if (!user || !token) {
      // Disconnect if no user or token
      if (socket) {
        socket.disconnect()
        setSocket(null)
        setIsConnected(false)
        setOnlineUsers([])
      }
      return
    }

    // Create socket connection with auth
    const baseUrl = process.env.NEXT_PUBLIC_API_URL 
      ? process.env.NEXT_PUBLIC_API_URL.replace('/api', '') 
      : 'http://localhost:5000'
    const newSocket = io(baseUrl, {
      auth: {
        token
      },
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      timeout: 10000,
    })

    // Connection events
    newSocket.on('connect', () => {
      console.log('✅ Connected to messaging server')
      setIsConnected(true)
      
      // Clear any existing reconnect timeout
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current)
      }
    })

    newSocket.on('disconnect', (reason) => {
      console.log('❌ Disconnected from messaging server:', reason)
      setIsConnected(false)
      
      // Show user-friendly disconnect message
      if (reason === 'io server disconnect') {
        toast.error('Connection lost', {
          description: 'Reconnecting to chat server...'
        })
      }
    })

    newSocket.on('connect_error', (error) => {
      console.error('❌ Connection error:', error)
      setIsConnected(false)
      
      // Retry connection with exponential backoff
      reconnectTimeoutRef.current = setTimeout(() => {
        if (!newSocket.connected) {
          newSocket.connect()
        }
      }, 2000)
    })

    // Message events
    newSocket.on('message:received', (data) => {
      console.log('📨 New message received:', data)
      
      // Show notification for new messages
      if (data.message.senderId?.toString() !== user.id?.toString()) {
        toast.info(`New message from ${data.message.sender.name}`, {
          description: data.message.content.length > 50 
            ? data.message.content.substring(0, 50) + '...'
            : data.message.content
        })
      }
    })

    newSocket.on('message:sent', (data) => {
      console.log('✅ Message sent confirmed:', data)
    })

    // User presence events
    newSocket.on('user:online', (data) => {
      console.log('🟢 User online:', data.email)
      setOnlineUsers(data.onlineUsers || [])
    })

    newSocket.on('user:offline', (data) => {
      console.log('🔴 User offline:', data.email)
      setOnlineUsers(data.onlineUsers || [])
    })

    // Typing indicators
    newSocket.on('user:typing', (data) => {
      console.log('⌨️ User typing:', data.email)
    })

    newSocket.on('user:stop_typing', (data) => {
      console.log('⏹️ User stopped typing:', data.email)
    })

    // Error handling
    newSocket.on('error', (error) => {
      console.error('Socket error:', error)
      toast.error('Chat error', {
        description: 'There was an issue with the chat service'
      })
    })

    setSocket(newSocket)

    // Cleanup
    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current)
      }
      newSocket.disconnect()
      setSocket(null)
      setIsConnected(false)
      setOnlineUsers([])
    }
  }, [user, token])

  const sendMessage = (content: string, type: 'GENERAL' | 'DIRECT' = 'GENERAL', receiverId?: string) => {
    if (!socket || !isConnected) {
      toast.error('Unable to send message', {
        description: 'Not connected to chat server'
      })
      return
    }

    if (!content.trim()) {
      toast.warning('Cannot send empty message')
      return
    }

    const messageData = {
      content: content.trim(),
      type,
      receiverId: type === 'DIRECT' ? receiverId : undefined
    }

    socket.emit('message:send', messageData)
  }

  const joinRoom = (room: string) => {
    if (socket && isConnected) {
      socket.emit('join', room)
    }
  }

  const leaveRoom = (room: string) => {
    if (socket && isConnected) {
      socket.emit('leave', room)
    }
  }

  const value: SocketContextType = {
    socket,
    isConnected,
    onlineUsers,
    sendMessage,
    joinRoom,
    leaveRoom
  }

  return (
    <SocketContext.Provider value={value}>
      {children}
    </SocketContext.Provider>
  )
}