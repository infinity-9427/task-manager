import { 
  UserDashboard, 
  AdminDashboard, 
  ProjectAnalytics,
  AnalyticsParams 
} from '@/types/api';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3200';

class AnalyticsService {
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

  async getUserDashboard(params: AnalyticsParams = {}): Promise<{ dashboard: UserDashboard }> {
    const queryParams = new URLSearchParams();
    
    if (params.period) queryParams.append('period', params.period);
    
    const queryString = queryParams.toString();
    const endpoint = `/analytics/dashboard${queryString ? `?${queryString}` : ''}`;
    
    return this.makeRequest<{ dashboard: UserDashboard }>(endpoint);
  }

  async getAdminDashboard(params: AnalyticsParams = {}): Promise<{ dashboard: AdminDashboard }> {
    const queryParams = new URLSearchParams();
    
    if (params.period) queryParams.append('period', params.period);
    
    const queryString = queryParams.toString();
    const endpoint = `/analytics/admin-dashboard${queryString ? `?${queryString}` : ''}`;
    
    return this.makeRequest<{ dashboard: AdminDashboard }>(endpoint);
  }

  async getProjectAnalytics(
    projectId: number, 
    params: AnalyticsParams = {}
  ): Promise<ProjectAnalytics> {
    const queryParams = new URLSearchParams();
    
    if (params.period) queryParams.append('period', params.period);
    
    const queryString = queryParams.toString();
    const endpoint = `/analytics/project/${projectId}${queryString ? `?${queryString}` : ''}`;
    
    return this.makeRequest<ProjectAnalytics>(endpoint);
  }

  // Utility methods for specific analytics data
  async getTaskCompletionRate(period: 'week' | 'month' | 'year' = 'week'): Promise<number> {
    const { dashboard } = await this.getUserDashboard({ period });
    return dashboard.overview.completionRate;
  }

  async getTasksByPriority(period: 'week' | 'month' | 'year' = 'week'): Promise<Record<string, number>> {
    const { dashboard } = await this.getUserDashboard({ period });
    return dashboard.tasksByPriority;
  }

  async getProductivityTrends(period: 'week' | 'month' | 'year' = 'month'): Promise<Array<{ date: string; completed: number; created: number }>> {
    const { dashboard } = await this.getUserDashboard({ period });
    return dashboard.trends.taskCompletion;
  }

  async getTimeTracking(period: 'week' | 'month' | 'year' = 'week'): Promise<{ totalMinutes: number; totalEntries: { id: number } }> {
    const { dashboard } = await this.getUserDashboard({ period });
    return dashboard.timeTracking;
  }

  async getRecentTasks(period: 'week' | 'month' | 'year' = 'week'): Promise<any[]> {
    const { dashboard } = await this.getUserDashboard({ period });
    return dashboard.recentTasks;
  }

  async getOverviewStats(period: 'week' | 'month' | 'year' = 'week'): Promise<{
    totalTasks: number;
    completedTasks: number;
    pendingTasks: number;
    inProgressTasks: number;
    overdueTasks: number;
    completionRate: number;
  }> {
    const { dashboard } = await this.getUserDashboard({ period });
    return dashboard.overview;
  }

  // Admin-specific analytics
  async getUserStats(period: 'week' | 'month' | 'year' = 'month'): Promise<{
    totalUsers: number;
    activeUsers: number;
    newUsers: number;
  }> {
    const { dashboard } = await this.getAdminDashboard({ period });
    return dashboard.userStats;
  }

  async getSystemStats(period: 'week' | 'month' | 'year' = 'month'): Promise<{
    totalTasks: number;
    totalProjects: number;
    totalMessages: number;
  }> {
    const { dashboard } = await this.getAdminDashboard({ period });
    return dashboard.systemStats;
  }

  // Project-specific analytics
  async getProjectTaskStats(projectId: number, period: 'week' | 'month' | 'year' = 'month'): Promise<{
    totalTasks: number;
    completedTasks: number;
    pendingTasks: number;
    inProgressTasks: number;
    overdueTasks: number;
    completionRate: number;
  }> {
    const analytics = await this.getProjectAnalytics(projectId, { period });
    return analytics.taskStats;
  }

  async getProjectTimeline(projectId: number, period: 'week' | 'month' | 'year' = 'month'): Promise<Array<{ date: string; completed: number; created: number }>> {
    const analytics = await this.getProjectAnalytics(projectId, { period });
    return analytics.timeline;
  }

  async getProjectTeamMembers(projectId: number): Promise<any[]> {
    const analytics = await this.getProjectAnalytics(projectId);
    return analytics.teamMembers;
  }

  // Utility methods for data processing
  calculateCompletionRate(completed: number, total: number): number {
    return total === 0 ? 0 : Math.round((completed / total) * 100);
  }

  formatDuration(minutes: number): string {
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    
    if (hours === 0) {
      return `${remainingMinutes}m`;
    } else if (remainingMinutes === 0) {
      return `${hours}h`;
    } else {
      return `${hours}h ${remainingMinutes}m`;
    }
  }

  getDateRange(period: 'week' | 'month' | 'year'): { start: Date; end: Date } {
    const end = new Date();
    const start = new Date();

    switch (period) {
      case 'week':
        start.setDate(end.getDate() - 7);
        break;
      case 'month':
        start.setMonth(end.getMonth() - 1);
        break;
      case 'year':
        start.setFullYear(end.getFullYear() - 1);
        break;
    }

    return { start, end };
  }
}

// Create and export singleton instance
export const analyticsService = new AnalyticsService();
export default analyticsService;
