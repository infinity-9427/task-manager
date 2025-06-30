"use client";
import { useState, useEffect, useRef } from "react";
import Image from "next/image";

interface User {
  id: string;
  name: string;
  email: string;
  isOnline: boolean;
  lastSeen?: Date;
  hasUnreadMessages?: boolean;
}

interface Message {
  id: string;
  senderId: string;
  receiverId?: string; // undefined for general chat
  content: string;
  timestamp: Date;
  isRead: boolean;
  senderName: string;
}

interface TeamChatProps {
  currentUserId: string;
  currentUserName: string;
}

export default function TeamChat({ currentUserId, currentUserName }: TeamChatProps) {
  const [users, setUsers] = useState<User[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [onlineCount, setOnlineCount] = useState(0);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Mock data - replace with real API calls
  useEffect(() => {
    const mockUsers: User[] = [
      {
        id: "1",
        name: "Sarah Chen",
        email: "sarah@example.com",
        isOnline: true,
        hasUnreadMessages: false,
      },
      {
        id: "2",
        name: "Mike Rodriguez",
        email: "mike@example.com",
        isOnline: true,
        hasUnreadMessages: false,
      },
      {
        id: "3",
        name: "Emma Johnson",
        email: "emma@example.com",
        isOnline: false,
        lastSeen: new Date(Date.now() - 1000 * 60 * 45), // 45 minutes ago
        hasUnreadMessages: false,
      },
      {
        id: "4",
        name: "David Park",
        email: "david@example.com",
        isOnline: true,
        hasUnreadMessages: false,
      },
    ];
    setUsers(mockUsers);
    setOnlineCount(mockUsers.filter(u => u.isOnline).length);

    // Mock general messages
    const mockMessages: Message[] = [
      {
        id: "1",
        senderId: "1",
        content: "Hey team! Just finished the user authentication module.",
        timestamp: new Date(Date.now() - 1000 * 60 * 30),
        isRead: true,
        senderName: "Sarah Chen",
      },
      {
        id: "2",
        senderId: "2",
        content: "Great work Sarah! I'll test it out later today.",
        timestamp: new Date(Date.now() - 1000 * 60 * 25),
        isRead: true,
        senderName: "Mike Rodriguez",
      },
      {
        id: "3",
        senderId: "4",
        content: "The API documentation has been updated in the shared folder.",
        timestamp: new Date(Date.now() - 1000 * 60 * 10),
        isRead: true,
        senderName: "David Park",
      },
    ];
    setMessages(mockMessages);
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const handleSendMessage = () => {
    if (!newMessage.trim()) return;

    const message: Message = {
      id: Date.now().toString(),
      senderId: currentUserId,
      receiverId: selectedUser?.id,
      content: newMessage.trim(),
      timestamp: new Date(),
      isRead: false,
      senderName: currentUserName,
    };

    setMessages([...messages, message]);
    setNewMessage("");
  };

  const handleUserSelect = (user: User) => {
    if (selectedUser?.id === user.id) {
      // Deselect if clicking the same user
      setSelectedUser(null);
    } else {
      setSelectedUser(user);
      // Mark messages as read for this user
      setUsers(users.map(u => 
        u.id === user.id ? { ...u, hasUnreadMessages: false } : u
      ));
    }
  };

  const formatMessageTime = (date: Date) => {
    const now = new Date();
    const isToday = date.toDateString() === now.toDateString();
    
    if (isToday) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }
    return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
  };

  const getFilteredMessages = () => {
    if (selectedUser) {
      // Private messages between current user and selected user
      return messages.filter(msg => 
        (msg.senderId === currentUserId && msg.receiverId === selectedUser.id) ||
        (msg.senderId === selectedUser.id && msg.receiverId === currentUserId)
      );
    }
    // General chat messages (no receiverId)
    return messages.filter(msg => !msg.receiverId);
  };

  const getChatTitle = () => {
    if (selectedUser) {
      return (
        <div className="flex items-center gap-2">
          <div className="relative">
            <div className="w-6 h-6 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center text-white text-xs font-medium">
              {selectedUser.name.split(' ').map(n => n[0]).join('').toUpperCase()}
            </div>
            {selectedUser.isOnline && (
              <div className="absolute -bottom-0.5 -right-0.5 w-2 h-2 bg-green-500 rounded-full border border-white"></div>
            )}
          </div>
          <span className="font-medium text-gray-800">{selectedUser.name}</span>
          <span className="text-xs text-gray-500">
            {selectedUser.isOnline ? "online" : "offline"}
          </span>
          <button
            onClick={() => setSelectedUser(null)}
            className="ml-auto p-1 hover:bg-gray-100 rounded-full transition-colors"
          >
            <svg className="w-3 h-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      );
    }
    return (
      <div className="flex items-center gap-2">
        <span className="text-gray-400 font-mono text-sm">#</span>
        <Image 
          src="/message.svg" 
          alt="General chat" 
          width={16} 
          height={16} 
          className="text-gray-500"
        />
        <span className="font-medium text-gray-800 text-sm lg:text-base">general</span>
        <span className="text-xs text-gray-500 hidden lg:inline">({onlineCount} online)</span>
      </div>
    );
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 flex flex-col h-[400px] sm:h-[450px] lg:h-[520px] xl:h-[600px] max-h-[80vh] w-full">
      {/* Header */}
      <div className="px-3 sm:px-4 py-3 border-b border-gray-100 flex items-center justify-between flex-shrink-0">
        {getChatTitle()}
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="p-1 hover:bg-gray-50 rounded transition-colors"
        >
          <svg 
            className={`w-3 h-3 text-gray-400 transition-transform ${isCollapsed ? 'rotate-180' : ''}`}
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>
      </div>

      {!isCollapsed && (
        <>
          {/* Connected Users Bar - Show in both general and private chat */}
          <div className="px-3 sm:px-4 py-2 border-b border-gray-50 flex-shrink-0">
            <div className="flex items-center gap-1 lg:gap-1.5 xl:gap-2 overflow-x-auto pb-1 scrollbar-hide">
              {!selectedUser && (
                <span className="text-xs text-gray-500 mr-2 flex-shrink-0 hidden lg:inline">Online:</span>
              )}
            
              {users.map((user) => (
                <button
                  key={user.id}
                  onClick={() => handleUserSelect(user)}
                  className="flex-shrink-0 relative group"
                  title={selectedUser?.id === user.id ? 'Currently chatting' : `Message ${user.name}`}
                >
                  <div className="relative">
                    <div className={`w-6 h-6 sm:w-7 sm:h-7 lg:w-8 lg:h-8 xl:w-9 xl:h-9 rounded-full flex items-center justify-center text-white text-xs lg:text-sm font-medium transition-all ${
                      selectedUser?.id === user.id 
                        ? 'bg-gradient-to-br from-blue-500 to-blue-600 scale-110' 
                        : 'bg-gradient-to-br from-gray-400 to-gray-500 group-hover:from-blue-400 group-hover:to-blue-500 group-hover:scale-105'
                    }`}>
                      {user.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                    </div>
                    {user.isOnline && (
                      <div className="absolute -bottom-0.5 -right-0.5 w-2 h-2 lg:w-2.5 lg:h-2.5 xl:w-3 xl:h-3 bg-green-500 rounded-full border border-white"></div>
                    )}
                  </div>
                </button>
              ))}

            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 p-3 sm:p-4 space-y-3 overflow-y-auto min-h-0">
            {getFilteredMessages().map((message) => (
              <div
                key={message.id}
                className={`flex ${message.senderId === currentUserId ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-xs px-3 py-2 rounded-lg ${
                    message.senderId === currentUserId
                      ? 'bg-blue-500 text-white'
                      : 'bg-gray-100 text-gray-900'
                  }`}
                >
                  {message.senderId !== currentUserId && !selectedUser && (
                    <p className="text-xs font-medium mb-1 text-gray-700">
                      {message.senderName}
                    </p>
                  )}
                  <p className="text-sm leading-relaxed">{message.content}</p>
                  <p className={`text-xs mt-1 ${
                    message.senderId === currentUserId ? 'text-blue-100' : 'text-gray-500'
                  }`}>
                    {formatMessageTime(message.timestamp)}
                  </p>
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
            
            {getFilteredMessages().length === 0 && (
              <div className="text-center py-8 text-gray-500">
                <svg className="w-8 h-8 mx-auto mb-2 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
                <p className="text-sm text-gray-600">
                  {selectedUser ? `Start a conversation with ${selectedUser.name}` : 'No messages yet. Say hello to your team!'}
                </p>
              </div>
            )}
          </div>

          {/* Message Input */}
          <div className="p-2 sm:p-3 border-t border-gray-100 flex-shrink-0">
            <div className="flex gap-2">
              <div className="flex-1 relative">
                <input
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                  placeholder={selectedUser ? `Message ${selectedUser.name}...` : "Message team..."}
                  className="w-full px-3 py-2 pr-8 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all text-gray-900"
                />
                {newMessage && (
                  <button
                    onClick={() => setNewMessage("")}
                    className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-gray-600 transition-colors"
                    title="Clear message"
                  >
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                )}
              </div>
              <button
                onClick={handleSendMessage}
                disabled={!newMessage.trim()}
                className="px-3 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                title="Send message"
              >
                <Image 
                  src="/send.svg" 
                  alt="Send" 
                  width={16} 
                  height={16} 
                  className="brightness-0 invert"
                />
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
