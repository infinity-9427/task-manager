import { 
  Conversation, 
  Message, 
  CreateConversationRequest, 
  SendMessageRequest,
  AddParticipantsRequest,
  MessageParams,
  ApiResponse 
} from '@/types/api';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

class MessagingService {
  private async makeRequest<T>(
    endpoint: string, 
    options: RequestInit = {}
  ): Promise<T> {
    const token = this.getToken();
    
    // Primary: Use external API at localhost:3200
    const externalUrl = `${API_BASE_URL}/api${endpoint}`;
    
    try {
      const config: RequestInit = {
        headers: {
          'Content-Type': 'application/json',
          ...(token && { Authorization: `Bearer ${token}` }),
          ...(options.headers || {})
        },
        ...options
      };

      const response = await fetch(externalUrl, config);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Request failed' }));
        throw new Error(errorData.error || `HTTP ${response.status}`);
      }

      if (response.status === 204) {
        return {} as T;
      }

      return response.json();
    } catch (error) {
      // If external API fails, try local Next.js API routes as fallback
      console.warn('External API unavailable, using local mock API:', error);
      
      const localUrl = `/api${endpoint}`;
      const config: RequestInit = {
        headers: {
          'Content-Type': 'application/json',
          ...(token && { Authorization: `Bearer ${token}` }),
          ...(options.headers || {})
        },
        ...options
      };

      const response = await fetch(localUrl, config);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Request failed' }));
        throw new Error(errorData.error || `HTTP ${response.status}`);
      }

      if (response.status === 204) {
        return {} as T;
      }

      return response.json();
    }
  }

  private getToken(): string | null {
    if (typeof window === 'undefined') return null;
    
    // Try to get from cookies first
    const cookies = document.cookie.split(';');
    const tokenCookie = cookies.find(c => c.trim().startsWith('accessToken='));
    if (tokenCookie) {
      return tokenCookie.split('=')[1];
    }
    
    // Fallback to localStorage
    return localStorage.getItem('accessToken');
  }

  // Conversation Management
  async createConversation(data: CreateConversationRequest): Promise<{ conversation: Conversation }> {
    return this.makeRequest<{ conversation: Conversation }>('/messaging/conversations', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }

  async getUserConversations(): Promise<Conversation[]> {
    const response = await this.makeRequest<{ conversations: Conversation[] } | Conversation[]>('/messaging/conversations');
    return Array.isArray(response) ? response : response.conversations || [];
  }

  async getConversationById(conversationId: number): Promise<Conversation> {
    return this.makeRequest<Conversation>(`/messaging/conversations/${conversationId}`);
  }

  async addParticipants(conversationId: number, data: AddParticipantsRequest): Promise<ApiResponse> {
    return this.makeRequest<ApiResponse>(`/messaging/conversations/${conversationId}/participants`, {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }

  async leaveConversation(conversationId: number): Promise<ApiResponse> {
    return this.makeRequest<ApiResponse>(`/messaging/conversations/${conversationId}/leave`, {
      method: 'DELETE'
    });
  }

  // Message Management
  async sendMessage(conversationId: number, data: SendMessageRequest): Promise<{ message: Message }> {
    return this.makeRequest<{ message: Message }>(`/messaging/conversations/${conversationId}/messages`, {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }

  async getConversationMessages(
    conversationId: number, 
    params: MessageParams = {}
  ): Promise<{ messages: Message[] }> {
    const queryParams = new URLSearchParams();
    
    if (params.page) queryParams.append('page', params.page.toString());
    if (params.limit) queryParams.append('limit', params.limit.toString());
    
    const queryString = queryParams.toString();
    const endpoint = `/messaging/conversations/${conversationId}/messages${queryString ? `?${queryString}` : ''}`;
    
    return this.makeRequest<{ messages: Message[] }>(endpoint);
  }

  async editMessage(conversationId: number, messageId: number, content: string): Promise<Message> {
    return this.makeRequest<Message>(`/messaging/conversations/${conversationId}/messages/${messageId}`, {
      method: 'PUT',
      body: JSON.stringify({ content })
    });
  }

  async deleteMessage(conversationId: number, messageId: number): Promise<ApiResponse> {
    return this.makeRequest<ApiResponse>(`/messaging/conversations/${conversationId}/messages/${messageId}`, {
      method: 'DELETE'
    });
  }

  async markMessageAsRead(conversationId: number, messageId: number): Promise<ApiResponse> {
    return this.makeRequest<ApiResponse>(`/messaging/conversations/${conversationId}/messages/${messageId}/read`, {
      method: 'PATCH'
    });
  }

  async addReaction(conversationId: number, messageId: number, emoji: string): Promise<Message> {
    return this.makeRequest<Message>(`/messaging/conversations/${conversationId}/messages/${messageId}/reactions`, {
      method: 'POST',
      body: JSON.stringify({ emoji })
    });
  }

  async removeReaction(conversationId: number, messageId: number, emoji: string): Promise<Message> {
    return this.makeRequest<Message>(`/messaging/conversations/${conversationId}/messages/${messageId}/reactions`, {
      method: 'DELETE',
      body: JSON.stringify({ emoji })
    });
  }

  // Utility methods
  async createDirectConversation(participantId: number): Promise<{ conversation: Conversation }> {
    return this.createConversation({
      type: 'DIRECT',
      participantIds: [participantId]
    });
  }

  async createGroupConversation(
    name: string, 
    participantIds: number[], 
    description?: string
  ): Promise<{ conversation: Conversation }> {
    return this.createConversation({
      type: 'GROUP',
      name,
      description,
      participantIds
    });
  }

  async searchMessages(conversationId: number, query: string): Promise<Message[]> {
    const { messages } = await this.getConversationMessages(conversationId, { limit: 1000 });
    return messages.filter(message => 
      message.content.toLowerCase().includes(query.toLowerCase())
    );
  }

  async getUnreadMessages(conversationId: number): Promise<Message[]> {
    const { messages } = await this.getConversationMessages(conversationId);
    return messages.filter(message => 
      message.readStatus && message.readStatus.length === 0
    );
  }

  async getConversationsByType(type: 'DIRECT' | 'GROUP' | 'GENERAL'): Promise<Conversation[]> {
    const conversations = await this.getUserConversations();
    return conversations.filter(conv => conv.type === type);
  }
}

// Create and export singleton instance
export const messagingService = new MessagingService();
export default messagingService;
