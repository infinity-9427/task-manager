// Shared user storage for mock API
// In a real application, this would be a database

export interface MockUser {
  id: number;
  username: string;
  email: string;
  password: string; // In real app, this would be hashed
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

// Use globalThis to persist data across hot reloads in development
declare global {
  var mockUsers: MockUser[] | undefined;
  var mockNextUserId: number | undefined;
}

// Initialize shared user storage - this persists across API calls during development
if (!globalThis.mockUsers) {
  globalThis.mockUsers = [
    // Demo user for testing
    {
      id: 1,
      username: 'demo',
      email: 'demo@example.com',
      password: 'password123',
      firstName: 'Demo',
      lastName: 'User',
      avatar: null,
      role: 'MEMBER',
      isActive: true,
      isOnline: false,
      lastSeen: null,
      emailVerified: false,
      emailVerificationToken: null,
      passwordResetToken: null,
      passwordResetExpires: null,
      createdAt: '2025-01-01T00:00:00.000Z',
      updatedAt: '2025-01-01T00:00:00.000Z'
    }
  ];
}

if (!globalThis.mockNextUserId) {
  globalThis.mockNextUserId = 2;
}

export function getUsers(): MockUser[] {
  return globalThis.mockUsers!;
}

export function addUser(user: Omit<MockUser, 'id'>): MockUser {
  const newUser: MockUser = {
    ...user,
    id: globalThis.mockNextUserId!++
  };
  globalThis.mockUsers!.push(newUser);
  console.log('Added user:', newUser.username, 'Total users:', globalThis.mockUsers!.length);
  return newUser;
}

export function findUserByUsername(username: string): MockUser | undefined {
  const user = globalThis.mockUsers!.find(u => u.username === username || u.email === username);
  console.log('Looking for user:', username, 'Found:', user ? user.username : 'not found', 'Total users:', globalThis.mockUsers!.length);
  return user;
}

export function findUserByEmail(email: string): MockUser | undefined {
  return globalThis.mockUsers!.find(u => u.email === email);
}
