"use client";
import { useState, useEffect } from "react";

interface User {
  id: string;
  name: string;
  email: string;
  isOnline: boolean;
  lastSeen?: Date;
}

interface Message {
  id: string;
  senderId: string;
  receiverId: string;
  content: string;
  timestamp: Date;
  isRead: boolean;
}

interface UsersAndChatProps {
  currentUserId: string;
}

export default function UsersAndChat({ currentUserId }: UsersAndChatProps) {
  const [users, setUsers] = useState<User[]>([]);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);

  // Mock data - replace with real API calls
  useEffect(() => {
    const mockUsers: User[] = [
      {
        id: "1",
        name: "John Doe",
        email: "john@example.com",
        isOnline: true,
      },
      {
        id: "2",
        name: "Jane Smith",
        email: "jane@example.com",
        isOnline: false,
        lastSeen: new Date(Date.now() - 1000 * 60 * 30), // 30 minutes ago
      },
      {
        id: "3",
        name: "Mike Johnson",
        email: "mike@example.com",
        isOnline: true,
      },
      {
        id: "4",
        name: "Sarah Wilson",
        email: "sarah@example.com",
        isOnline: false,
        lastSeen: new Date(Date.now() - 1000 * 60 * 60 * 2), // 2 hours ago
      },
    ];
    setUsers(mockUsers);
  }, []);

  const handleUserSelect = (user: User) => {
    setSelectedUser(user);
    setIsChatOpen(true);
    // Load messages for this user (mock data)
    const mockMessages: Message[] = [
      {
        id: "1",
        senderId: user.id,
        receiverId: currentUserId,
        content: "Hey, how's the project going?",
        timestamp: new Date(Date.now() - 1000 * 60 * 10),
        isRead: true,
      },
      {
        id: "2",
        senderId: currentUserId,
        receiverId: user.id,
        content: "It's going well! Just working on the task manager features.",
        timestamp: new Date(Date.now() - 1000 * 60 * 5),
        isRead: true,
      },
    ];
    setMessages(mockMessages);
  };

  const handleSendMessage = () => {
    if (!newMessage.trim() || !selectedUser) return;

    const message: Message = {
      id: Date.now().toString(),
      senderId: currentUserId,
      receiverId: selectedUser.id,
      content: newMessage.trim(),
      timestamp: new Date(),
      isRead: false,
    };

    setMessages([...messages, message]);
    setNewMessage("");
  };

  const formatLastSeen = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / (1000 * 60));
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (minutes < 1) return "Just now";
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    return `${days}d ago`;
  };

  const formatMessageTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <>
      {/* Users Panel */}
      <div className="bg-white rounded-lg shadow-md border border-gray-200 mb-6">
        {/* Header */}
        <div className="px-4 py-3 border-b border-gray-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <svg 
              className="w-5 h-5 text-gray-600" 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={2} 
                d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" 
              />
            </svg>
            <h3 className="font-semibold text-gray-800">Team Members</h3>
            <span className="bg-green-100 text-green-800 text-xs font-medium px-2 py-1 rounded-full">
              {users.filter(u => u.isOnline).length} online
            </span>
          </div>
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="p-1 hover:bg-gray-100 rounded transition-colors"
          >
            <svg 
              className={`w-4 h-4 text-gray-500 transition-transform ${isCollapsed ? 'rotate-180' : ''}`}
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
        </div>

        {/* Users List */}
        {!isCollapsed && (
          <div className="p-4">
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {users.map((user) => (
                <div
                  key={user.id}
                  onClick={() => handleUserSelect(user)}
                  className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors border border-transparent hover:border-gray-200"
                >
                  {/* Avatar */}
                  <div className="relative">
                    <div className="w-10 h-10 bg-indigo-500 rounded-full flex items-center justify-center text-white font-medium">
                      {user.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                    </div>
                    {/* Online status indicator */}
                    <div className={`absolute -bottom-1 -right-1 w-3 h-3 rounded-full border-2 border-white ${
                      user.isOnline ? 'bg-green-500' : 'bg-gray-400'
                    }`}></div>
                  </div>

                  {/* User info */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {user.name}
                    </p>
                    <p className="text-xs text-gray-500 truncate">
                      {user.isOnline ? (
                        <span className="text-green-600">Online</span>
                      ) : user.lastSeen ? (
                        `Last seen ${formatLastSeen(user.lastSeen)}`
                      ) : (
                        "Offline"
                      )}
                    </p>
                  </div>

                  {/* Chat icon */}
                  <div className="flex-shrink-0">
                    <svg 
                      className="w-4 h-4 text-gray-400" 
                      fill="none" 
                      stroke="currentColor" 
                      viewBox="0 0 24 24"
                    >
                      <path 
                        strokeLinecap="round" 
                        strokeLinejoin="round" 
                        strokeWidth={2} 
                        d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" 
                      />
                    </svg>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Chat Modal */}
      {isChatOpen && selectedUser && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-gray-800/60 flex items-center justify-center p-4">
          <div className="relative bg-white rounded-lg shadow-xl max-w-md w-full max-h-[80vh] flex flex-col">
            {/* Chat Header */}
            <div className="px-4 py-3 border-b border-gray-200 flex items-center justify-between bg-gray-50 rounded-t-lg">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <div className="w-8 h-8 bg-indigo-500 rounded-full flex items-center justify-center text-white text-sm font-medium">
                    {selectedUser.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                  </div>
                  <div className={`absolute -bottom-1 -right-1 w-2.5 h-2.5 rounded-full border border-white ${
                    selectedUser.isOnline ? 'bg-green-500' : 'bg-gray-400'
                  }`}></div>
                </div>
                <div>
                  <h3 className="font-medium text-gray-900">{selectedUser.name}</h3>
                  <p className="text-xs text-gray-500">
                    {selectedUser.isOnline ? "Online" : "Offline"}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsChatOpen(false)}
                className="p-1 rounded-full hover:bg-gray-200 transition-colors"
              >
                <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Messages */}
            <div className="flex-1 p-4 overflow-y-auto space-y-3 min-h-0">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${message.senderId === currentUserId ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-xs lg:max-w-md px-3 py-2 rounded-lg ${
                      message.senderId === currentUserId
                        ? 'bg-indigo-500 text-white'
                        : 'bg-gray-100 text-gray-900'
                    }`}
                  >
                    <p className="text-sm">{message.content}</p>
                    <p className={`text-xs mt-1 ${
                      message.senderId === currentUserId ? 'text-indigo-200' : 'text-gray-500'
                    }`}>
                      {formatMessageTime(message.timestamp)}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            {/* Message Input */}
            <div className="p-4 border-t border-gray-200">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                  placeholder="Type a message..."
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm"
                />
                <button
                  onClick={handleSendMessage}
                  disabled={!newMessage.trim()}
                  className="px-4 py-2 bg-indigo-500 text-white rounded-md hover:bg-indigo-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
