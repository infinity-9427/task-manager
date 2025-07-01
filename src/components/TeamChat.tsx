"use client";
import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import { messagingService, socketService } from "@/services";
import userService from "@/services/userService";
import type { User, Message, SendMessageRequest } from "@/types/api";
import { useAuth } from "@/app/context/AuthContext";

interface TeamChatProps {
  currentUserId?: string;
  currentUserName?: string;
}

interface LocalUser extends User {
  hasUnreadMessages?: boolean;
}

export default function TeamChat({ currentUserId, currentUserName }: TeamChatProps) {
  const { isAuthenticated, user } = useAuth();
  const [users, setUsers] = useState<LocalUser[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [selectedUser, setSelectedUser] = useState<LocalUser | null>(null);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [onlineCount, setOnlineCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedConversationId, setSelectedConversationId] = useState<number | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const actualUserId = user?.id || Number(currentUserId);
  const actualUserName = user?.username || currentUserName;

  useEffect(() => {
    if (!isAuthenticated || !actualUserId) return;

    const loadData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Load users
        const usersData = await userService.getAllUsers();
        const usersWithUnread = usersData
          .filter(u => u.id !== actualUserId) // Exclude current user
          .map(u => ({
            ...u,
            hasUnreadMessages: false
          }));
        setUsers(usersWithUnread);

        // Load general conversations (or create one if none exists)
        const conversations = await messagingService.getUserConversations();
        console.log('Loaded conversations:', conversations);
        
        const generalConversation = conversations?.find(c => c?.type === 'GENERAL');
        
        if (generalConversation) {
          const convMessages = await messagingService.getConversationMessages(generalConversation.id);
          setMessages(convMessages.messages || []);
          setSelectedConversationId(generalConversation.id);
        } else {
          // No general conversation exists - we can work without it for now
          console.log('No general conversation found, using direct messaging only');
          setMessages([]);
        }

      } catch (err) {
        console.error('Failed to load chat data:', err);
        setError('Failed to load chat data');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [isAuthenticated, actualUserId]);

  useEffect(() => {
    if (!isAuthenticated) return;

    // Setup real-time message listeners
    const handleNewMessage = (message: Message) => {
      setMessages(prev => [...prev, message]);
    };

    const handleUserStatusChanged = (data: { userId: number; isOnline: boolean }) => {
      setUsers(prev => prev.map(u => 
        u.id === data.userId ? { ...u, isOnline: data.isOnline } : u
      ));
    };

    socketService.on('messageReceived', handleNewMessage);
    socketService.on('userStatusChanged', handleUserStatusChanged);

    return () => {
      socketService.off('messageReceived', handleNewMessage);
      socketService.off('userStatusChanged', handleUserStatusChanged);
    };
  }, [isAuthenticated]);

  useEffect(() => {
    // Count online users
    setOnlineCount(users.filter(u => u.isOnline).length);
  }, [users]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !selectedConversationId) return;

    try {
      const messageRequest: SendMessageRequest = {
        content: newMessage.trim(),
      };

      await messagingService.sendMessage(selectedConversationId, messageRequest);
      setNewMessage("");
    } catch (err) {
      console.error('Failed to send message:', err);
      setError('Failed to send message');
    }
  };

  const handleSelectUser = async (selectedUser: LocalUser) => {
    setSelectedUser(selectedUser);
    setLoading(true);
    
    try {
      // Find or create direct conversation with this user
      const conversations = await messagingService.getUserConversations();
      let directConversation = conversations.find(c => 
        c.type === 'DIRECT' && 
        c.participants.some(p => p.userId === selectedUser.id)
      );

      if (!directConversation) {
        const newConversation = await messagingService.createDirectConversation(selectedUser.id);
        directConversation = newConversation.conversation;
      }

      // Load messages for this conversation
      const convMessages = await messagingService.getConversationMessages(directConversation.id);
      setMessages(convMessages.messages);
      setSelectedConversationId(directConversation.id);
      
    } catch (err) {
      console.error('Failed to load direct conversation:', err);
      setError('Failed to load conversation');
    } finally {
      setLoading(false);
    }
  };

  const handleBackToGeneral = async () => {
    setSelectedUser(null);
    setLoading(true);
    
    try {
      const conversations = await messagingService.getUserConversations();
      const generalConversation = conversations.find(c => c.type === 'GENERAL');
      
      if (generalConversation) {
        const convMessages = await messagingService.getConversationMessages(generalConversation.id);
        setMessages(convMessages.messages);
        setSelectedConversationId(generalConversation.id);
      }
    } catch (err) {
      console.error('Failed to load general conversation:', err);
      setError('Failed to load general conversation');
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const formatTime = (timestamp: Date | string) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const getUserById = (id: number) => {
    return users.find(u => u.id === id);
  };

  const getDisplayMessages = () => {
    // Always show messages from the currently selected conversation
    return messages;
  };

  if (!isAuthenticated) {
    return (
      <div className="w-80 bg-white border-l border-gray-200 p-4">
        <p className="text-gray-500 text-center">Please log in to access team chat</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="w-80 bg-white border-l border-gray-200 p-4">
        <p className="text-gray-500 text-center">Loading chat...</p>
      </div>
    );
  }

  return (
    <div className={`${isCollapsed ? 'w-16' : 'w-80'} bg-white border-l border-gray-200 transition-all duration-300 ease-in-out flex flex-col`}>
      {/* Header */}
      <div className="p-4 border-b border-gray-200 flex items-center justify-between">
        {!isCollapsed && (
          <div className="flex items-center">
            <Image src="/message.svg" alt="Chat" width={20} height={20} />
            <h3 className="font-semibold text-gray-800 ml-2">
              {selectedUser ? selectedUser.username : 'Team Chat'}
            </h3>
          </div>
        )}
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors"
          aria-label={isCollapsed ? "Expand chat" : "Collapse chat"}
        >
          <svg 
            className={`w-4 h-4 text-gray-600 transition-transform ${isCollapsed ? 'rotate-180' : ''}`} 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
      </div>

      {!isCollapsed && (
        <>
          {/* Navigation */}
          <div className="flex border-b border-gray-200">
            <button
              onClick={handleBackToGeneral}
              className={`flex-1 py-3 px-4 text-sm font-medium transition-colors ${
                !selectedUser 
                  ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50' 
                  : 'text-gray-600 hover:text-gray-800 hover:bg-gray-50'
              }`}
            >
              General
            </button>
            <button
              onClick={() => {/* Show users list */}}
              className={`flex-1 py-3 px-4 text-sm font-medium transition-colors ${
                selectedUser 
                  ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50' 
                  : 'text-gray-600 hover:text-gray-800 hover:bg-gray-50'
              }`}
            >
              Direct ({onlineCount})
            </button>
          </div>

          {/* Users List (when in Direct mode and no user selected) */}
          {selectedUser === null && (
            <div className="flex-1 overflow-y-auto">
              <div className="p-2">
                <p className="text-xs text-gray-500 uppercase tracking-wider font-medium mb-2">
                  Team Members ({users.length})
                </p>
                {users.map((user) => (
                  <button
                    key={user.id}
                    onClick={() => handleSelectUser(user)}
                    className="w-full p-3 rounded-lg hover:bg-gray-50 transition-colors text-left flex items-center space-x-3"
                  >
                    <div className="relative">
                      <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-sm font-medium">
                        {user.username.charAt(0).toUpperCase()}
                      </div>
                      {user.isOnline && (
                        <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 border-2 border-white rounded-full"></div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {user.username}
                      </p>
                      <p className="text-xs text-gray-500">
                        {user.isOnline ? 'Online' : 'Offline'}
                      </p>
                    </div>
                    {user.hasUnreadMessages && (
                      <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                    )}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Messages */}
          {(selectedUser || selectedUser === null) && (
            <>
              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {error && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-red-700 text-sm">
                    {error}
                  </div>
                )}
                {getDisplayMessages().map((message) => {
                  const sender = getUserById(message.senderId);
                  const isOwnMessage = message.senderId === Number(actualUserId);
                  
                  return (
                    <div
                      key={message.id}
                      className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'}`}
                    >
                      <div className={`max-w-xs lg:max-w-sm ${isOwnMessage ? 'order-2' : 'order-1'}`}>
                        {!isOwnMessage && (
                          <div className="flex items-center mb-1">
                            <div className="w-6 h-6 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-xs font-medium mr-2">
                              {sender?.username?.charAt(0).toUpperCase() || '?'}
                            </div>
                            <span className="text-xs text-gray-600 font-medium">
                              {sender?.username || 'Unknown'}
                            </span>
                          </div>
                        )}
                        <div
                          className={`px-3 py-2 rounded-lg text-sm ${
                            isOwnMessage
                              ? 'bg-blue-600 text-white rounded-br-sm'
                              : 'bg-gray-100 text-gray-800 rounded-bl-sm'
                          }`}
                        >
                          {message.content}
                        </div>
                        <p className={`text-xs text-gray-500 mt-1 ${isOwnMessage ? 'text-right' : 'text-left'}`}>
                          {formatTime(message.createdAt)}
                        </p>
                      </div>
                    </div>
                  );
                })}
                <div ref={messagesEndRef} />
              </div>

              {/* Message Input */}
              <div className="p-4 border-t border-gray-200">
                <div className="flex items-end space-x-2">
                  <div className="flex-1">
                    <textarea
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      onKeyPress={handleKeyPress}
                      placeholder={selectedUser ? `Message ${selectedUser.username}...` : "Type a message..."}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                      rows={1}
                      style={{
                        minHeight: '40px',
                        maxHeight: '100px'
                      }}
                    />
                  </div>
                  <button
                    onClick={handleSendMessage}
                    disabled={!newMessage.trim()}
                    className="p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
                    aria-label="Send message"
                  >
                    <Image src="/send.svg" alt="Send" width={16} height={16} className="brightness-0 invert" />
                  </button>
                </div>
              </div>
            </>
          )}
        </>
      )}
    </div>
  );
}
