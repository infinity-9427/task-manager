'use client'

import { useState, useRef, useEffect } from 'react'
import { RiSendPlaneFill, RiHashtag } from '@remixicon/react'
import { Button } from '@/components/ui/button'

interface Message {
  id: string
  user: {
    name: string
    role: string
    color: string
  }
  message: string
  timestamp: Date
}

const mockMessages: Message[] = [
  {
    id: '1',
    user: { name: 'Sarah Chen', role: 'PM', color: 'bg-purple-500' },
    message: 'Sprint review scheduled for 3pm today. Please prepare your updates.',
    timestamp: new Date(Date.now() - 600000),
  },
  {
    id: '2',
    user: { name: 'Alex Rodriguez', role: 'FE', color: 'bg-blue-500' },
    message: 'Authentication module completed and tested ✅',
    timestamp: new Date(Date.now() - 480000),
  },
  {
    id: '3',
    user: { name: 'Michael Kim', role: 'BE', color: 'bg-green-500' },
    message: 'API v2.1 deployed to staging environment',
    timestamp: new Date(Date.now() - 360000),
  },
  {
    id: '4',
    user: { name: 'Emma Thompson', role: 'UX', color: 'bg-orange-500' },
    message: 'Updated dashboard prototypes available in Figma',
    timestamp: new Date(Date.now() - 180000),
  }
]

const formatTime = (date: Date) => {
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  
  if (diffMins < 1) return 'now'
  if (diffMins < 60) return `${diffMins}m`
  return `${Math.floor(diffMins / 60)}h`
}

const getUserInitials = (name: string) => {
  return name.split(' ').map(n => n[0]).join('').toUpperCase()
}

interface ChatSidebarProps {
  isMobile?: boolean
}

export default function ChatSidebar({ isMobile = false }: ChatSidebarProps) {
  const [messages, setMessages] = useState<Message[]>(mockMessages)
  const [newMessage, setNewMessage] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const handleSendMessage = () => {
    if (!newMessage.trim()) return

    const message: Message = {
      id: Date.now().toString(),
      user: { name: 'You', role: 'Dev', color: 'bg-indigo-500' },
      message: newMessage.trim(),
      timestamp: new Date(),
    }

    setMessages(prev => [...prev, message])
    setNewMessage('')
    setIsTyping(false)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setNewMessage(e.target.value)
    setIsTyping(e.target.value.length > 0)
  }

  if (isMobile) {
    return (
      <div className="flex flex-col h-full bg-white">
        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3 min-h-0">
          {messages.map((message) => (
            <div key={message.id} className="group hover:bg-gray-50/50 rounded-lg p-2 -mx-2 transition-colors duration-150">
              <div className="flex gap-3">
                <div className={`w-8 h-8 ${message.user.color} rounded-lg flex items-center justify-center text-white text-xs font-semibold flex-shrink-0 shadow-sm`}>
                  {getUserInitials(message.user.name)}
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-baseline gap-2 mb-1">
                    <span className="text-sm font-semibold text-gray-900 truncate">
                      {message.user.name.split(' ')[0]}
                    </span>
                    <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded-md">
                      {message.user.role}
                    </span>
                    <span className="text-xs text-gray-400">
                      {formatTime(message.timestamp)}
                    </span>
                  </div>
                  
                  <div className="text-sm text-gray-700 leading-relaxed break-words">
                    {message.message}
                  </div>
                </div>
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>

        {/* Mobile Input */}
        <div className="border-t border-gray-200 p-4 bg-gray-50/50">
          <div className="flex gap-3">
            <input
              value={newMessage}
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
              placeholder="Type a message..."
              className="flex-1 px-3 py-3 text-sm bg-white border border-gray-200 rounded-xl focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100/50 transition-all duration-200"
            />
            
            <Button 
              onClick={handleSendMessage}
              disabled={!newMessage.trim()}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-3 rounded-xl shadow-sm"
            >
              <RiSendPlaneFill className="w-4 h-4" />
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
        <div className="flex items-center gap-2">
          <RiHashtag className="w-4 h-4 text-gray-600" />
          <h3 className="text-sm font-semibold text-gray-800">general</h3>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-3 py-2 space-y-3 min-h-0 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent">
        {messages.map((message) => (
          <div key={message.id} className="group hover:bg-gray-50/50 rounded-lg p-2 -mx-2 transition-colors duration-150">
            <div className="flex gap-3">
              <div className={`w-7 h-7 ${message.user.color} rounded-lg flex items-center justify-center text-white text-xs font-semibold flex-shrink-0 shadow-sm ring-2 ring-white transition-transform duration-150 group-hover:scale-105`}>
                {getUserInitials(message.user.name)}
              </div>
              
              <div className="flex-1 min-w-0">
                <div className="flex items-baseline gap-2 mb-1">
                  <span className="text-sm font-semibold text-gray-900 truncate">
                    {message.user.name.split(' ')[0]}
                  </span>
                  <span className="text-xs text-gray-500 bg-gray-100/80 px-1.5 py-0.5 rounded-md font-medium">
                    {message.user.role}
                  </span>
                  <span className="text-xs text-gray-400 font-medium">
                    {formatTime(message.timestamp)}
                  </span>
                </div>
                
                <div className="text-sm text-gray-700 leading-relaxed break-words">
                  {message.message}
                </div>
              </div>
            </div>
          </div>
        ))}
        
        {isTyping && (
          <div className="flex gap-3 opacity-60">
            <div className="w-7 h-7 bg-gray-300 rounded-lg flex items-center justify-center">
              <div className="flex gap-0.5">
                <div className="w-1 h-1 bg-gray-500 rounded-full animate-bounce"></div>
                <div className="w-1 h-1 bg-gray-500 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                <div className="w-1 h-1 bg-gray-500 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
              </div>
            </div>
            <div className="flex-1 flex items-center">
              <span className="text-xs text-gray-500 italic">Someone is typing...</span>
            </div>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="border-t border-gray-100/60 p-3 flex-shrink-0 bg-gray-50/30">
        <div className="flex gap-2">
          <div className="flex-1 relative">
            <input
              value={newMessage}
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
              placeholder="Type a message..."
              className="w-full px-3 py-2.5 text-sm bg-white border border-gray-200/80 rounded-xl focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100/50 transition-all duration-200 placeholder-gray-500 shadow-sm min-w-0"
            />
          </div>
          
          <Button 
            onClick={handleSendMessage}
            disabled={!newMessage.trim()}
            size="sm"
            className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 disabled:from-gray-300 disabled:to-gray-400 text-white px-3 py-2.5 rounded-xl flex-shrink-0 shadow-sm hover:shadow-md transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <RiSendPlaneFill className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  )
}