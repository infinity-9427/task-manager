"use client";
import { useEffect, useState } from 'react';
import userService from '@/services/userService';
import type { User } from '@/types/api';

export default function UserServiceTest() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [authToken, setAuthToken] = useState<string | null>(null);

  useEffect(() => {
    const testUserService = async () => {
      try {
        console.log('🧪 Testing userService.getAllUsers()...');
        
        // First, try to get an auth token for testing
        const loginResponse = await fetch('http://localhost:3200/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ username: 'testuser3', password: 'password123' })
        });
        
        if (loginResponse.ok) {
          const loginData = await loginResponse.json();
          const token = loginData.accessToken;
          setAuthToken(token);
          
          // Store token in localStorage for userService to use
          if (typeof window !== 'undefined') {
            localStorage.setItem('accessToken', token);
          }
          
          console.log('✅ Got auth token, now testing userService...');
          
          const result = await userService.getAllUsers();
          console.log('✅ Users fetched successfully:', result);
          setUsers(result);
          setError(null);
        } else {
          throw new Error('Failed to authenticate for testing');
        }
      } catch (err) {
        console.error('❌ Error in test:', err);
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    };

    testUserService();
  }, []);

  if (loading) return <div className="p-4 text-blue-600">Testing userService (authenticating first)...</div>;
  if (error) return <div className="p-4 text-red-600">Error: {error}</div>;

  return (
    <div className="p-4 bg-green-50 border border-green-200 rounded-lg mb-4">
      <h2 className="text-lg font-bold mb-2 text-green-600">✅ UserService Test Successful!</h2>
      <p className="text-sm text-green-700 mb-2">Authenticated and fetched {users.length} users:</p>
      <ul className="space-y-1">
        {users.slice(0, 3).map(user => (
          <li key={user.id} className="text-xs text-green-800">
            {user.username} ({user.email}) - {user.isOnline ? '🟢 Online' : '⚫ Offline'}
          </li>
        ))}
        {users.length > 3 && <li className="text-xs text-green-600">... and {users.length - 3} more</li>}
      </ul>
      {authToken && <p className="text-xs text-green-600 mt-2">Token: {authToken.substring(0, 20)}...</p>}
    </div>
  );
}
