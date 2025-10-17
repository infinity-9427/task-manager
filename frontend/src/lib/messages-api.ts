import useSWR, { mutate } from 'swr'
import { API_ENDPOINTS } from '@/lib/constants'
import Cookies from 'js-cookie'

export interface Message {
  id: string
  content: string
  type: 'GENERAL' | 'DIRECT'
  senderId: string
  receiverId?: string
  sender: {
    id: string
    name: string
    email: string
    avatar?: string
  }
  receiver?: {
    id: string
    name: string
    email: string
    avatar?: string
  }
  createdAt: string
  updatedAt: string
}

export interface MessagesResponse {
  messages: Message[]
  pagination: {
    page: number
    limit: number
    total: number
    pages: number
  }
}

export interface User {
  id: string
  name: string
  email: string
  avatar?: string
}

class MessagesAPI {
  private baseURL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api'

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const token = typeof window !== 'undefined' ? Cookies.get('auth_token') : null
    
    if (!token) {
      console.warn('MessagesAPI: No auth token available for request')
    } else {
      console.log('MessagesAPI: Using token:', token.substring(0, 20) + '...')
    }
    
    const config: RequestInit = {
      headers: {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` }),
        ...options.headers,
      },
      ...options,
    }

    console.log('MessagesAPI: Making request to:', `${this.baseURL}${endpoint}`)
    const response = await fetch(`${this.baseURL}${endpoint}`, config)

    if (!response.ok) {
      console.error('MessagesAPI: Request failed with status:', response.status, response.statusText)
      
      // Handle authentication errors
      if (response.status === 401 && typeof window !== 'undefined') {
        Cookies.remove('auth_token')
        Cookies.remove('auth_user')
        
        // Only redirect if not already on auth page
        if (!window.location.pathname.includes('/auth')) {
          setTimeout(() => {
            window.location.href = '/auth?mode=login'
          }, 100)
        }
      }
      
      const errorData = await response.json().catch(() => ({}))
      console.error('MessagesAPI: Error data:', errorData)
      throw new Error(errorData.message || errorData.error || `HTTP ${response.status}`)
    }

    return response.json()
  }

  // Send a new message
  async sendMessage(data: {
    content: string
    type: 'GENERAL' | 'DIRECT'
    receiverId?: string
  }): Promise<{ message: Message }> {
    const result = await this.request<{ message: Message }>('/messages', {
      method: 'POST',
      body: JSON.stringify(data),
    })

    // Optimistically update the cache
    if (data.type === 'GENERAL') {
      mutate('/messages/general?page=1&limit=50')
    } else if (data.receiverId) {
      mutate(`/messages/direct/${data.receiverId}?page=1&limit=50`)
    }

    return result
  }

  // Get general chat messages
  async getGeneralMessages(page = 1, limit = 50): Promise<MessagesResponse> {
    return this.request<MessagesResponse>(`/messages/general?page=${page}&limit=${limit}`)
  }

  // Get direct messages with a specific user
  async getDirectMessages(userId: string, page = 1, limit = 50): Promise<MessagesResponse> {
    return this.request<MessagesResponse>(`/messages/direct/${userId}?page=${page}&limit=${limit}`)
  }

  // Get list of users for messaging
  async getUsers(): Promise<{ users: User[] }> {
    return this.request<{ users: User[] }>('/messages/users')
  }
}

export const messagesAPI = new MessagesAPI()

// SWR Hooks
export function useGeneralMessages(page = 1, limit = 50) {
  const token = typeof window !== 'undefined' ? Cookies.get('auth_token') : null
  
  return useSWR(
    token ? `/messages/general?page=${page}&limit=${limit}` : null,
    () => messagesAPI.getGeneralMessages(page, limit),
    {
      refreshInterval: 0, // Don't poll since we use WebSocket for real-time updates
      revalidateOnFocus: true,
      revalidateOnReconnect: true,
      dedupingInterval: 2000, // Dedupe requests within 2 seconds
    }
  )
}

export function useDirectMessages(userId: string, page = 1, limit = 50) {
  const token = typeof window !== 'undefined' ? Cookies.get('auth_token') : null
  
  return useSWR(
    token && userId ? `/messages/direct/${userId}?page=${page}&limit=${limit}` : null,
    () => messagesAPI.getDirectMessages(userId, page, limit),
    {
      refreshInterval: 0, // Don't poll since we use WebSocket for real-time updates
      revalidateOnFocus: true,
      revalidateOnReconnect: true,
      dedupingInterval: 2000,
    }
  )
}

export function useMessagingUsers() {
  const token = typeof window !== 'undefined' ? Cookies.get('auth_token') : null
  
  return useSWR(
    token ? '/messages/users' : null,
    () => messagesAPI.getUsers(),
    {
      refreshInterval: 5 * 60 * 1000, // Refresh every 5 minutes
      revalidateOnFocus: false,
      dedupingInterval: 5000,
    }
  )
}

// Mutation helpers
export async function sendMessage(data: {
  content: string
  type: 'GENERAL' | 'DIRECT'
  receiverId?: string
}) {
  try {
    const result = await messagesAPI.sendMessage(data)
    return result
  } catch (error) {
    console.error('Failed to send message:', error)
    throw error
  }
}

// Cache invalidation helpers
export function invalidateMessages() {
  mutate(key => typeof key === 'string' && key.startsWith('/messages'), undefined, { revalidate: true })
}

export function invalidateGeneralMessages() {
  mutate(key => typeof key === 'string' && key.includes('/messages/general'), undefined, { revalidate: true })
}

export function invalidateDirectMessages(userId: string) {
  mutate(key => typeof key === 'string' && key.includes(`/messages/direct/${userId}`), undefined, { revalidate: true })
}