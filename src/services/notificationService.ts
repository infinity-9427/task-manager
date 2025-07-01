import { 
  type Notification, 
  NotificationsResponse, 
  NotificationPreferences,
  CreateSystemNotificationRequest,
  NotificationParams,
  ApiResponse 
} from '@/types/api';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3200';

class NotificationService {
  private async makeRequest<T>(
    endpoint: string, 
    options: RequestInit = {}
  ): Promise<T> {
    const token = this.getToken();
    const url = `${API_BASE_URL}/api${endpoint}`;
    
    const config: RequestInit = {
      headers: {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` }),
        ...(options.headers || {})
      },
      ...options
    };

    const response = await fetch(url, config);
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Request failed' }));
      const errorMessage = errorData.error || errorData.message || `HTTP ${response.status}`;
      
      // Handle specific HTTP status codes
      if (response.status === 401) {
        throw new Error('Invalid token');
      }
      
      throw new Error(errorMessage);
    }

    if (response.status === 204) {
      return {} as T;
    }

    return response.json();
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

  async getUserNotifications(params: NotificationParams = {}): Promise<NotificationsResponse> {
    const queryParams = new URLSearchParams();
    
    if (params.page) queryParams.append('page', params.page.toString());
    if (params.limit) queryParams.append('limit', params.limit.toString());
    if (params.unreadOnly !== undefined) queryParams.append('unreadOnly', params.unreadOnly.toString());
    
    const queryString = queryParams.toString();
    const endpoint = `/notifications${queryString ? `?${queryString}` : ''}`;
    
    const response = await this.makeRequest<{ data: Notification[] }>(endpoint);
    
    // Transform the response to match what the frontend expects
    return {
      notifications: response.data || [],
      unreadCount: response.data?.filter(n => !n.isRead).length || 0,
      pagination: {
        page: params.page || 1,
        limit: params.limit || 50,
        total: response.data?.length || 0
      }
    };
  }

  async markNotificationAsRead(notificationId: number): Promise<ApiResponse> {
    return this.makeRequest<ApiResponse>(`/notifications/${notificationId}/read`, {
      method: 'PATCH'
    });
  }

  async markAllNotificationsAsRead(): Promise<ApiResponse> {
    return this.makeRequest<ApiResponse>('/notifications/mark-all-read', {
      method: 'PATCH'
    });
  }

  async deleteNotification(notificationId: number): Promise<ApiResponse> {
    return this.makeRequest<ApiResponse>(`/notifications/${notificationId}`, {
      method: 'DELETE'
    });
  }

  async getNotificationPreferences(): Promise<NotificationPreferences> {
    return this.makeRequest<NotificationPreferences>('/notifications/preferences');
  }

  async updateNotificationPreferences(preferences: NotificationPreferences): Promise<NotificationPreferences> {
    return this.makeRequest<NotificationPreferences>('/notifications/preferences', {
      method: 'PUT',
      body: JSON.stringify(preferences)
    });
  }

  async createSystemNotification(data: CreateSystemNotificationRequest): Promise<ApiResponse> {
    return this.makeRequest<ApiResponse>('/notifications/system', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }

  // Utility methods
  async getUnreadCount(): Promise<number> {
    const response = await this.getUserNotifications({ unreadOnly: true, limit: 1 });
    return response.unreadCount;
  }

  async getRecentNotifications(limit: number = 10): Promise<Notification[]> {
    const response = await this.getUserNotifications({ limit });
    return response.notifications;
  }

  async getNotificationsByType(type: string): Promise<Notification[]> {
    const response = await this.getUserNotifications({ limit: 1000 });
    return response.notifications.filter(notification => notification.type === type);
  }

  async markMultipleAsRead(notificationIds: number[]): Promise<void> {
    // Since there's no bulk endpoint, we'll mark them one by one
    await Promise.all(
      notificationIds.map(id => this.markNotificationAsRead(id))
    );
  }

  async deleteMultiple(notificationIds: number[]): Promise<void> {
    // Since there's no bulk endpoint, we'll delete them one by one
    await Promise.all(
      notificationIds.map(id => this.deleteNotification(id))
    );
  }

  async getTaskNotifications(): Promise<Notification[]> {
    const response = await this.getUserNotifications({ limit: 1000 });
    return response.notifications.filter(notification => 
      ['TASK_ASSIGNED', 'TASK_COMPLETED', 'TASK_OVERDUE', 'TASK_MENTIONED'].includes(notification.type)
    );
  }

  async getMessageNotifications(): Promise<Notification[]> {
    return this.getNotificationsByType('MESSAGE_RECEIVED');
  }

  // Real-time notification handling helpers
  handleNewNotification(notification: Notification): void {
    // Show browser notification if permissions granted
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification(notification.title, {
        body: notification.message,
        icon: '/logo.webp',
        tag: `notification-${notification.id}`
      });
    }

    // Dispatch custom event for UI updates
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('new-notification', { 
        detail: notification 
      }));
    }
  }

  async requestNotificationPermission(): Promise<NotificationPermission> {
    if ('Notification' in window) {
      return await Notification.requestPermission();
    }
    return 'denied';
  }
}

// Create and export singleton instance
export const notificationService = new NotificationService();
export default notificationService;
