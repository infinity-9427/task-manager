import { HealthCheckResponse } from '@/types/api';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3200/api';

class HealthService {
  private async makeRequest<T>(
    endpoint: string, 
    options: RequestInit = {}
  ): Promise<T> {
    const config: RequestInit = {
      headers: {
        'Content-Type': 'application/json',
        ...(options.headers || {})
      },
      ...options
    };

    const response = await fetch(`${API_BASE_URL}${endpoint}`, config);
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Request failed' }));
      throw new Error(errorData.error || `HTTP ${response.status}`);
    }

    return response.json();
  }

  async checkHealth(): Promise<HealthCheckResponse> {
    return this.makeRequest<HealthCheckResponse>('/health');
  }

  async isApiAvailable(): Promise<boolean> {
    try {
      const health = await this.checkHealth();
      return health.status === 'OK';
    } catch (error) {
      console.warn('API health check failed:', error);
      return false;
    }
  }

  async getUptime(): Promise<number> {
    try {
      const health = await this.checkHealth();
      return health.uptime;
    } catch (error) {
      console.warn('Could not get API uptime:', error);
      return 0;
    }
  }

  formatUptime(uptimeSeconds: number): string {
    const days = Math.floor(uptimeSeconds / (24 * 60 * 60));
    const hours = Math.floor((uptimeSeconds % (24 * 60 * 60)) / (60 * 60));
    const minutes = Math.floor((uptimeSeconds % (60 * 60)) / 60);

    if (days > 0) {
      return `${days}d ${hours}h ${minutes}m`;
    } else if (hours > 0) {
      return `${hours}h ${minutes}m`;
    } else {
      return `${minutes}m`;
    }
  }

  // Utility method to monitor API status
  async monitorApiStatus(
    onStatusChange?: (isAvailable: boolean) => void,
    intervalMs: number = 60000 // Check every minute
  ): Promise<() => void> {
    let lastStatus: boolean | null = null;
    
    const checkStatus = async () => {
      const currentStatus = await this.isApiAvailable();
      
      if (lastStatus !== null && lastStatus !== currentStatus && onStatusChange) {
        onStatusChange(currentStatus);
      }
      
      lastStatus = currentStatus;
    };

    // Initial check
    await checkStatus();

    // Set up interval
    const intervalId = setInterval(checkStatus, intervalMs);

    // Return cleanup function
    return () => clearInterval(intervalId);
  }
}

// Create and export singleton instance
export const healthService = new HealthService();
export default healthService;
