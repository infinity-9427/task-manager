"use client";
import { useState, useEffect } from "react";
import { userService, messagingService, socketService } from "@/services";
import type { User, Message, SendMessageRequest } from "@/types/api";
import { useAuth } from "@/app/context/AuthContext";

interface UsersAndChatProps {
  currentUserId?: string;
}

export default function UsersAndChat({ currentUserId }: UsersAndChatProps) {
  const { isAuthenticated, user } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedConversationId, setSelectedConversationId] = useState<number | null>(null);

  const actualUserId = user?.id || Number(currentUserId);

  useEffect(() => {
    if (!isAuthenticated || !actualUserId) return;

    const loadUsers = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const usersData = await userService.getAllUsers();
        // Filter out current user
        const otherUsers = usersData.filter(u => u.id !== actualUserId);
        setUsers(otherUsers);
      } catch (err) {
        console.error('Failed to load users:', err);
        setError('Failed to load users');
      } finally {
        setLoading(false);
      }
    };

    loadUsers();
  }, [isAuthenticated, actualUserId]);

  useEffect(() => {
    if (!isAuthenticated) return;

    // Setup real-time listeners
    const handleNewMessage = (message: Message) => {
      if (selectedConversationId) {
        setMessages(prev => [...prev, message]);
      }
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
  }, [isAuthenticated, selectedConversationId]);

  const handleUserSelect = async (user: User) => {
    setSelectedUser(user);
    setIsChatOpen(true);
    setLoading(true);

    try {
      // Find or create direct conversation with this user
      const conversations = await messagingService.getUserConversations();
      let directConversation = conversations.find(c => 
        c.type === 'DIRECT' && 
        c.participants.some(p => p.userId === user.id)
      );

      if (!directConversation) {
        const newConversation = await messagingService.createDirectConversation(user.id);
        directConversation = newConversation.conversation;
      }

      // Load messages for this conversation
      const convMessages = await messagingService.getConversationMessages(directConversation.id);
      setMessages(convMessages.messages);
      setSelectedConversationId(directConversation.id);
      
    } catch (err) {
      console.error('Failed to load conversation:', err);
      setError('Failed to load conversation');
    } finally {
      setLoading(false);
    }
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

  if (!isAuthenticated) {
    return (
      <div className="w-80 bg-white border-l border-gray-200 p-4">
        <p className="text-gray-500 text-center">Please log in to access users and chat</p>
      </div>
    );
  }

  return (
    <div className={`${isCollapsed ? 'w-16' : 'w-80'} bg-white border-l border-gray-200 transition-all duration-300 ease-in-out flex flex-col`}>
      {/* Header */}
      <div className="p-4 border-b border-gray-200 flex items-center justify-between">
        {!isCollapsed && (
          <h3 className="font-semibold text-gray-800">
            {isChatOpen && selectedUser ? `Chat with ${selectedUser.username}` : 'Team Members'}
          </h3>
        )}
        <div className="flex items-center space-x-2">
          {isChatOpen && !isCollapsed && (
            <button
              onClick={() => {
                setIsChatOpen(false);
                setSelectedUser(null);
                setMessages([]);
                setSelectedConversationId(null);
              }}
              className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors"
              aria-label="Back to users list"
            >
              <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
          )}
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors"
            aria-label={isCollapsed ? "Expand" : "Collapse"}
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
      </div>

      {!isCollapsed && (
        <>
          {/* Users List */}
          {!isChatOpen && (
            <div className="flex-1 overflow-y-auto p-4">
              {loading ? (
                <p className="text-gray-500 text-center">Loading users...</p>
              ) : error ? (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-red-700 text-sm">
                  {error}
                </div>
              ) : (
                <div className="space-y-2">
                  <p className="text-xs text-gray-500 uppercase tracking-wider font-medium mb-3">
                    Online ({users.filter(u => u.isOnline).length})
                  </p>
                  
                  {users.filter(u => u.isOnline).map((user) => (
                    <button
                      key={user.id}
                      onClick={() => handleUserSelect(user)}
                      className="w-full p-3 rounded-lg hover:bg-gray-50 transition-colors text-left flex items-center space-x-3"
                    >
                      <div className="relative">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-medium">
                          {user.username.charAt(0).toUpperCase()}
                        </div>
                        <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 border-2 border-white rounded-full"></div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {user.username}
                        </p>
                        <p className="text-xs text-green-600">Online</p>
                      </div>
                    </button>
                  ))}

                  {users.filter(u => !u.isOnline).length > 0 && (
                    <>
                      <p className="text-xs text-gray-500 uppercase tracking-wider font-medium mb-3 mt-6">
                        Offline ({users.filter(u => !u.isOnline).length})
                      </p>
                      
                      {users.filter(u => !u.isOnline).map((user) => (
                        <button
                          key={user.id}
                          onClick={() => handleUserSelect(user)}
                          className="w-full p-3 rounded-lg hover:bg-gray-50 transition-colors text-left flex items-center space-x-3"
                        >
                          <div className="w-10 h-10 rounded-full bg-gray-300 flex items-center justify-center text-white font-medium">
                            {user.username.charAt(0).toUpperCase()}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900 truncate">
                              {user.username}
                            </p>
                            <p className="text-xs text-gray-500">
                              Last seen: {user.lastSeen ? formatTime(user.lastSeen) : 'Unknown'}
                            </p>
                          </div>
                        </button>
                      ))}
                    </>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Chat Interface */}
          {isChatOpen && selectedUser && (
            <>
              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {error && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-red-700 text-sm">
                    {error}
                  </div>
                )}
                
                {loading ? (
                  <p className="text-gray-500 text-center">Loading messages...</p>
                ) : (
                  messages.map((message) => {
                    const isOwnMessage = message.senderId === actualUserId;
                    
                    return (
                      <div
                        key={message.id}
                        className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'}`}
                      >
                        <div className={`max-w-xs lg:max-w-sm ${isOwnMessage ? 'order-2' : 'order-1'}`}>
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
                  })
                )}
              </div>

              {/* Message Input */}
              <div className="p-4 border-t border-gray-200">
                <div className="flex items-end space-x-2">
                  <div className="flex-1">
                    <textarea
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      onKeyPress={handleKeyPress}
                      placeholder={`Message ${selectedUser.username}...`}
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
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                    </svg>
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
