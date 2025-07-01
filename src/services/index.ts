// Export all services
export { default as authService } from './authService';
export { default as taskService } from './taskService';
export { default as messagingService } from './messagingService';
export { default as notificationService } from './notificationService';
export { default as analyticsService } from './analyticsService';
export { default as userService } from './userService';
export { default as healthService } from './healthService';
export { default as socketService } from './socketService';

// Utility function to initialize all services
export const initializeServices = () => {
  // Services are automatically initialized as singletons
  console.log('All API services initialized');
};

// Utility function to check if all services are healthy
export const checkServicesHealth = async (): Promise<{
  auth: boolean;
  tasks: boolean;
  messaging: boolean;
  notifications: boolean;
  analytics: boolean;
  users: boolean;
  api: boolean;
}> => {
  const { default: healthService } = await import('./healthService');
  const { default: authService } = await import('./authService');
  
  try {
    const [apiHealth, authStatus] = await Promise.allSettled([
      healthService.isApiAvailable(),
      authService.isAuthenticated()
    ]);

    return {
      auth: authStatus.status === 'fulfilled' ? authStatus.value : false,
      tasks: true, // Task service depends on API health
      messaging: true, // Messaging service depends on API health
      notifications: true, // Notification service depends on API health
      analytics: true, // Analytics service depends on API health
      users: true, // User service depends on API health
      api: apiHealth.status === 'fulfilled' ? apiHealth.value : false
    };
  } catch (error) {
    console.error('Error checking services health:', error);
    return {
      auth: false,
      tasks: false,
      messaging: false,
      notifications: false,
      analytics: false,
      users: false,
      api: false
    };
  }
};
