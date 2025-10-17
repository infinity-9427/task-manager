'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { RiSendPlaneFill, RiHashtag, RiWifiOffLine, RiCheckLine } from '@remixicon/react'
import { Button } from '@/components/ui/button'
import { useSocket } from '@/contexts/socket-context'
import { useAuth } from '@/contexts/auth-context'
import { useGeneralMessages, Message, invalidateGeneralMessages } from '@/lib/messages-api'
import { toast } from 'sonner'

const formatTime = (dateString: string) => {
  const date = new Date(dateString)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  
  if (diffMins < 1) return 'now'
  if (diffMins < 60) return `${diffMins}m`
  if (diffMins < 1440) return `${Math.floor(diffMins / 60)}h`
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

const getUserInitials = (name: string) => {
  return name.split(' ').map(n => n[0]).join('').toUpperCase()
}

const getUserColor = (name: string) => {
  const colors = [
    'bg-purple-500', 'bg-blue-500', 'bg-green-500', 'bg-orange-500',
    'bg-red-500', 'bg-pink-500', 'bg-indigo-500', 'bg-teal-500'
  ]
  const hash = name.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0)
  return colors[hash % colors.length]
}

interface ChatSidebarProps {
  isMobile?: boolean
}

export default function ChatSidebar({ isMobile = false }: ChatSidebarProps) {
  const { socket, isConnected, sendMessage: socketSendMessage, onlineUsers } = useSocket()
  const { user } = useAuth()
  const { data: messagesData, error, isLoading, mutate } = useGeneralMessages(1, 50)
  const [newMessage, setNewMessage] = useState('')
  const [isSending, setIsSending] = useState(false)
  const [typingUsers, setTypingUsers] = useState<Set<string>>(new Set())
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  const messages = messagesData?.messages || []

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [])

  useEffect(() => {
    scrollToBottom()
  }, [messages, scrollToBottom])

  // Real-time message handlers
  useEffect(() => {
    if (!socket) return

    const handleNewMessage = (data: { message: Message }) => {
      // Optimistically add the message and revalidate
      mutate((currentData) => {
        if (!currentData) return currentData
        return {
          ...currentData,
          messages: [...currentData.messages, data.message]
        }
      }, false)
      
      // Revalidate to get fresh data from server
      setTimeout(() => mutate(), 100)
      scrollToBottom()
    }

    const handleTyping = (data: { userId: string, email: string }) => {
      if (data.userId?.toString() !== user?.id?.toString()) {
        setTypingUsers(prev => new Set([...prev, data.email]))
        
        // Clear typing indicator after 3 seconds
        setTimeout(() => {
          setTypingUsers(prev => {
            const newSet = new Set(prev)
            newSet.delete(data.email)
            return newSet
          })
        }, 3000)
      }
    }

    const handleStopTyping = (data: { userId: string, email: string }) => {
      setTypingUsers(prev => {
        const newSet = new Set(prev)
        newSet.delete(data.email)
        return newSet
      })
    }

    socket.on('message:received', handleNewMessage)
    socket.on('user:typing', handleTyping)
    socket.on('user:stop_typing', handleStopTyping)

    return () => {
      socket.off('message:received', handleNewMessage)
      socket.off('user:typing', handleTyping)
      socket.off('user:stop_typing', handleStopTyping)
    }
  }, [socket, user?.id, mutate, scrollToBottom])

  const handleSendMessage = async () => {
    if (!newMessage.trim() || isSending || !isConnected) return

    setIsSending(true)
    
    try {
      socketSendMessage(newMessage.trim(), 'GENERAL')
      setNewMessage('')
      
      // Stop typing indicator
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current)
      }
      socket?.emit('typing:stop')
      
    } catch (error) {
      console.error('Failed to send message:', error)
      toast.error('Failed to send message', {
        description: 'Please try again'
      })
    } finally {
      setIsSending(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setNewMessage(e.target.value)
    
    // Handle typing indicators
    if (socket && isConnected) {
      if (e.target.value.length > 0) {
        socket.emit('typing:start')
        
        // Clear existing timeout
        if (typingTimeoutRef.current) {
          clearTimeout(typingTimeoutRef.current)
        }
        
        // Set timeout to stop typing after 2 seconds of inactivity
        typingTimeoutRef.current = setTimeout(() => {
          socket.emit('typing:stop')
        }, 2000)
      } else {
        socket.emit('typing:stop')
        if (typingTimeoutRef.current) {
          clearTimeout(typingTimeoutRef.current)
        }
      }
    }
  }

  // Loading state
  if (isLoading) {
    return (
      <div className={isMobile ? "flex flex-col h-full bg-white" : "hidden lg:flex w-80 xl:w-96 bg-white/80 backdrop-blur-sm border-l border-gray-100/80 flex-col flex-shrink-0 h-full overflow-hidden"}>
        <div className="flex-1 flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </div>
    )
  }

  // Error state
  if (error) {
    return (
      <div className={isMobile ? "flex flex-col h-full bg-white" : "hidden lg:flex w-80 xl:w-96 bg-white/80 backdrop-blur-sm border-l border-gray-100/80 flex-col flex-shrink-0 h-full overflow-hidden"}>
        <div className="flex-1 flex items-center justify-center text-red-600">
          <div className="text-center">
            <p className="text-sm">Failed to load messages</p>
            <button 
              onClick={() => mutate()} 
              className="text-xs text-blue-600 hover:underline mt-1"
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    )
  }

  if (isMobile) {
    return (
      <div className="flex flex-col h-full bg-white">
        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3 min-h-0">
          {(!messages || messages.length === 0) ? (
            <div className="flex flex-col items-center justify-center h-full text-center py-8">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                <RiHashtag className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="text-sm font-medium text-gray-900 mb-2">No messages yet</h3>
              <p className="text-xs text-gray-500 max-w-xs">Be the first to start the conversation in this channel.</p>
            </div>
          ) : (
            messages.map((message) => {
            const isCurrentUser = message?.senderId?.toString() === user?.id?.toString()
            const senderColor = getUserColor(message?.sender?.name || 'Unknown')
            
            return (
              <div key={message.id} className="group hover:bg-gray-50/50 rounded-lg p-2 -mx-2 transition-colors duration-150">
                <div className="flex gap-3">
                  <div className={`w-8 h-8 ${senderColor} rounded-lg flex items-center justify-center text-white text-xs font-semibold flex-shrink-0 shadow-sm`}>
                    {getUserInitials(message?.sender?.name || 'U')}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-baseline gap-2 mb-1">
                      <span className="text-sm font-semibold text-gray-900 truncate">
                        {isCurrentUser ? 'You' : (message?.sender?.name || 'Unknown').split(' ')[0]}
                      </span>
                      <span className="text-xs text-gray-400">
                        {formatTime(message?.createdAt || new Date().toISOString())}
                      </span>
                      {isCurrentUser && (
                        <RiCheckLine className="w-3 h-3 text-green-500" />
                      )}
                    </div>
                    
                    <div className="text-sm text-gray-700 leading-relaxed break-words">
                      {message?.content || ''}
                    </div>
                  </div>
                </div>
              </div>
            )
          }))}
          
          {/* Typing indicators */}
          {typingUsers.size > 0 && (
            <div className="flex gap-3 opacity-60">
              <div className="w-8 h-8 bg-gray-300 rounded-lg flex items-center justify-center">
                <div className="flex gap-0.5">
                  <div className="w-1 h-1 bg-gray-500 rounded-full animate-bounce"></div>
                  <div className="w-1 h-1 bg-gray-500 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                  <div className="w-1 h-1 bg-gray-500 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                </div>
              </div>
              <div className="flex-1 flex items-center">
                <span className="text-xs text-gray-500 italic">
                  {Array.from(typingUsers).join(', ')} {typingUsers.size === 1 ? 'is' : 'are'} typing...
                </span>
              </div>
            </div>
          )}
          
          <div ref={messagesEndRef} />
        </div>

        {/* Mobile Input */}
        <div className="border-t border-gray-200 p-4 bg-gray-50/50">
          {!isConnected && (
            <div className="mb-3 p-2 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2">
              <RiWifiOffLine className="w-4 h-4 text-red-600" />
              <span className="text-xs text-red-700">Disconnected - Reconnecting...</span>
            </div>
          )}
          <div className="flex gap-3">
            <input
              value={newMessage}
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
              placeholder={isConnected ? "Type a message..." : "Connecting..."}
              disabled={!isConnected || isSending}
              className="flex-1 px-3 py-3 text-sm bg-white border border-gray-200 rounded-xl focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100/50 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            />
            
            <Button 
              onClick={handleSendMessage}
              disabled={!newMessage.trim() || !isConnected || isSending}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-3 rounded-xl shadow-sm disabled:opacity-50"
            >
              {isSending ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              ) : (
                <RiSendPlaneFill className="w-4 h-4" />
              )}
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="hidden lg:flex w-80 xl:w-96 bg-white/80 backdrop-blur-sm border-l border-gray-100/80 flex-col flex-shrink-0 h-full overflow-hidden">
      {/* Header */}
      <div className="px-4 py-3 border-b border-gray-100/60 flex-shrink-0 bg-gradient-to-r from-gray-50/50 to-blue-50/30">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <RiHashtag className="w-4 h-4 text-gray-600" />
            <h3 className="text-sm font-semibold text-gray-800">general</h3>
          </div>

        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-3 py-2 space-y-3 min-h-0 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent">
        {(!messages || messages.length === 0) ? (
          <div className="flex flex-col items-center justify-center h-full text-center py-12">
            <div className="w-16 h-16 bg-gradient-to-br from-gray-100 to-gray-200 rounded-full flex items-center justify-center mb-6 shadow-sm">
              <RiHashtag className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-sm font-semibold text-gray-900 mb-2">No messages yet</h3>
            <p className="text-xs text-gray-500 max-w-xs leading-relaxed">Start a conversation by sending the first message in this channel.</p>
          </div>
        ) : (
          messages.map((message) => {
          const isCurrentUser = message?.senderId?.toString() === user?.id?.toString()
          const senderColor = getUserColor(message?.sender?.name || 'Unknown')
          
          return (
            <div key={message.id} className="group hover:bg-gray-50/50 rounded-lg p-2 -mx-2 transition-colors duration-150">
              <div className="flex gap-3">
                <div className={`w-7 h-7 ${senderColor} rounded-lg flex items-center justify-center text-white text-xs font-semibold flex-shrink-0 shadow-sm ring-2 ring-white transition-transform duration-150 group-hover:scale-105`}>
                  {getUserInitials(message?.sender?.name || 'U')}
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-baseline gap-2 mb-1">
                    <span className="text-sm font-semibold text-gray-900 truncate">
                      {isCurrentUser ? 'You' : (message?.sender?.name || 'Unknown').split(' ')[0]}
                    </span>
                    <span className="text-xs text-gray-400 font-medium">
                      {formatTime(message?.createdAt || new Date().toISOString())}
                    </span>
                    {isCurrentUser && (
                      <RiCheckLine className="w-3 h-3 text-green-500" />
                    )}
                  </div>
                  
                  <div className="text-sm text-gray-700 leading-relaxed break-words">
                    {message?.content || ''}
                  </div>
                </div>
              </div>
            </div>
          )
        }))}
        
        {/* Typing indicators */}
        {typingUsers.size > 0 && (
          <div className="flex gap-3 opacity-60">
            <div className="w-7 h-7 bg-gray-300 rounded-lg flex items-center justify-center">
              <div className="flex gap-0.5">
                <div className="w-1 h-1 bg-gray-500 rounded-full animate-bounce"></div>
                <div className="w-1 h-1 bg-gray-500 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                <div className="w-1 h-1 bg-gray-500 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
              </div>
            </div>
            <div className="flex-1 flex items-center">
              <span className="text-xs text-gray-500 italic">
                {Array.from(typingUsers).join(', ')} {typingUsers.size === 1 ? 'is' : 'are'} typing...
              </span>
            </div>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="border-t border-gray-100/60 p-3 flex-shrink-0 bg-gray-50/30">
        {!isConnected && (
          <div className="mb-2 p-2 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2">
            <RiWifiOffLine className="w-3 h-3 text-red-600" />
            <span className="text-xs text-red-700">Reconnecting...</span>
          </div>
        )}
        <div className="flex gap-2">
          <div className="flex-1 relative">
            <input
              value={newMessage}
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
              placeholder={isConnected ? "Type a message..." : "Connecting..."}
              disabled={!isConnected || isSending}
              className="w-full px-3 py-2.5 text-sm bg-white border border-gray-200/80 rounded-xl focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100/50 transition-all duration-200 placeholder-gray-500 shadow-sm min-w-0 disabled:opacity-50 disabled:cursor-not-allowed"
            />
          </div>
          
          <Button 
            onClick={handleSendMessage}
            disabled={!newMessage.trim() || !isConnected || isSending}
            size="sm"
            className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 disabled:from-gray-300 disabled:to-gray-400 text-white px-3 py-2.5 rounded-xl flex-shrink-0 shadow-sm hover:shadow-md transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSending ? (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
            ) : (
              <RiSendPlaneFill className="w-4 h-4" />
            )}
          </Button>
        </div>
      </div>
    </div>
  )
}