// API Response Types
export interface ApiResponse<T = any> {
  data?: T;
  message?: string;
  error?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// Authentication Types
export interface User {
  id: number;
  username: string;
  email: string;
  firstName?: string;
  lastName?: string;
  avatar?: string | null;
  role: 'MEMBER' | 'ADMIN' | 'MODERATOR';
  isActive: boolean;
  isOnline: boolean;
  lastSeen: string | null;
  emailVerified: boolean;
  emailVerificationToken?: string | null;
  passwordResetToken?: string | null;
  passwordResetExpires?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface AuthResponse {
  message: string;
  user: User;
  accessToken: string;
  refreshToken: string;
}

export interface LoginRequest {
  username: string;
  password: string;
}

export interface RegisterRequest {
  username: string;
  email: string;
  password: string;
  firstName?: string;
  lastName?: string;
}

export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
}

export interface ForgotPasswordRequest {
  email: string;
}

export interface ResetPasswordRequest {
  token: string;
  newPassword: string;
}

// Task Types
export type TaskStatus = 'PENDING' | 'IN_PROGRESS' | 'COMPLETED';
export type TaskPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';

export interface Task {
  id: number;
  title: string;
  description?: string;
  projectId?: number;
  parentTaskId?: number;
  assignedToId?: number;
  createdById: number;
  status: TaskStatus;
  priority: TaskPriority;
  dueDate?: string;
  estimatedHours?: number;
  actualHours: number;
  completionPercentage: number;
  tags: string[];
  labels: string[];
  customFields: Record<string, any>;
  position?: number;
  isRecurring: boolean;
  recurringPattern?: string;
  archivedAt?: string;
  completedAt?: string;
  createdAt: string;
  updatedAt: string;
  createdBy?: User;
  assignedTo?: User;
  project?: Project;
}

export interface CreateTaskRequest {
  title: string;
  description?: string;
  status?: TaskStatus;
  priority?: TaskPriority;
  projectId?: number;
  assignedToId?: number;
  dueDate?: string;
  estimatedHours?: number;
  tags?: string[];
}

export interface UpdateTaskRequest {
  title?: string;
  description?: string;
  status?: TaskStatus;
  priority?: TaskPriority;
  projectId?: number;
  assignedToId?: number;
  dueDate?: string;
  estimatedHours?: number;
  tags?: string[];
  completionPercentage?: number;
}

// Project Types
export interface Project {
  id: number;
  name: string;
  description?: string;
  createdById: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

// Messaging Types
export type ConversationType = 'DIRECT' | 'GROUP' | 'GENERAL';
export type MessageType = 'TEXT' | 'IMAGE' | 'FILE' | 'SYSTEM';

export interface Conversation {
  id: number;
  type: ConversationType;
  name?: string;
  description?: string;
  projectId?: number;
  taskId?: number;
  createdById: number;
  isActive: boolean;
  lastMessageAt?: string;
  createdAt: string;
  updatedAt: string;
  participants: ConversationParticipant[];
}

export interface ConversationParticipant {
  id: number;
  conversationId: number;
  userId: number;
  joinedAt: string;
  leftAt?: string;
  muted: boolean;
  user: User;
}

export interface Message {
  id: number;
  conversationId: number;
  senderId: number;
  parentMessageId?: number;
  content: string;
  messageType: MessageType;
  attachments: any[];
  mentions: number[];
  reactions: Record<string, any>;
  isEdited: boolean;
  editedAt?: string;
  isDeleted: boolean;
  deletedAt?: string;
  createdAt: string;
  updatedAt: string;
  sender: User;
  parentMessage?: Message;
  readStatus?: any[];
}

export interface CreateConversationRequest {
  type: ConversationType;
  name?: string;
  description?: string;
  participantIds: number[];
}

export interface SendMessageRequest {
  content: string;
  messageType?: MessageType;
  mentions?: number[];
  parentMessageId?: number;
}

export interface AddParticipantsRequest {
  userIds: number[];
}

// Notification Types
export type NotificationType = 
  | 'TASK_ASSIGNED' 
  | 'TASK_COMPLETED' 
  | 'TASK_OVERDUE' 
  | 'TASK_MENTIONED' 
  | 'MESSAGE_RECEIVED' 
  | 'GENERAL_NOTIFICATION';

export interface Notification {
  id: number;
  userId: number;
  type: NotificationType;
  title: string;
  message: string;
  data?: Record<string, any>;
  isRead: boolean;
  readAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface NotificationsResponse {
  notifications: Notification[];
  unreadCount: number;
  pagination: {
    page: number;
    limit: number;
    total: number;
  };
}

export interface NotificationPreferences {
  emailNotifications: boolean;
  pushNotifications: boolean;
  taskAssigned: boolean;
  taskCompleted: boolean;
  messageReceived: boolean;
  mentionReceived: boolean;
}

export interface CreateSystemNotificationRequest {
  type: NotificationType;
  title: string;
  message: string;
  recipientIds: number[];
}

// Analytics Types
export interface DashboardOverview {
  totalTasks: number;
  completedTasks: number;
  pendingTasks: number;
  inProgressTasks: number;
  overdueTasks: number;
  completionRate: number;
}

export type TasksByPriority = {
  [key in TaskPriority]: number;
}

export interface TimeTracking {
  totalMinutes: number;
  totalEntries: { id: number };
}

export interface TaskCompletionTrend {
  date: string;
  completed: number;
  created: number;
}

export interface UserDashboard {
  overview: DashboardOverview;
  tasksByPriority: TasksByPriority;
  timeTracking: TimeTracking;
  recentTasks: Task[];
  projects: Project[];
  trends: {
    taskCompletion: TaskCompletionTrend[];
    period: 'week' | 'month' | 'year';
  };
}

export interface AdminDashboard extends UserDashboard {
  userStats: {
    totalUsers: number;
    activeUsers: number;
    newUsers: number;
  };
  systemStats: {
    totalTasks: number;
    totalProjects: number;
    totalMessages: number;
  };
}

export interface ProjectAnalytics {
  project: Project;
  taskStats: DashboardOverview;
  teamMembers: User[];
  timeline: TaskCompletionTrend[];
}

// Socket.IO Types
export interface SocketEvents {
  // Client to Server
  join_conversation: { conversationId: number };
  leave_conversation: { conversationId: number };
  send_message: {
    conversationId: number;
    content: string;
    messageType?: MessageType;
  };
  typing_start: { conversationId: number };
  typing_stop: { conversationId: number };

  // Server to Client
  message_received: Message;
  notification_received: Notification;
  user_status_changed: { userId: number; isOnline: boolean };
  typing_indicator: { conversationId: number; userId: number; isTyping: boolean };
  task_updated: Task;
  conversation_updated: Conversation;
}

// API Query Parameters
export interface PaginationParams {
  page?: number;
  limit?: number;
}

export interface NotificationParams extends PaginationParams {
  unreadOnly?: boolean;
}

export interface MessageParams extends PaginationParams {
  // Additional message-specific params can be added here
}

export interface AnalyticsParams {
  period?: 'week' | 'month' | 'year';
}

// Error Types
export interface ApiError {
  error: string;
  statusCode?: number;
  details?: any;
}

// Health Check
export interface HealthCheckResponse {
  status: 'OK' | 'ERROR';
  timestamp: string;
  uptime: number;
}
