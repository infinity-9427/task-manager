"use client";
import { useEffect, useState } from 'react';

export default function BackendConnectionTest() {
  const [status, setStatus] = useState<'testing' | 'success' | 'failed'>('testing');
  const [message, setMessage] = useState('');
  const [details, setDetails] = useState('');

  useEffect(() => {
    const testConnection = async () => {
      try {
        console.log('🔍 Testing connection to backend...');
        
        // Test health endpoint first
        const healthResponse = await fetch('http://localhost:3200/health');
        if (!healthResponse.ok) {
          throw new Error(`Health check failed: ${healthResponse.status}`);
        }
        const healthData = await healthResponse.json();
        console.log('✅ Health check passed:', healthData);
        
        // Test API endpoint
        const apiResponse = await fetch('http://localhost:3200/api/');
        if (!apiResponse.ok) {
          throw new Error(`API check failed: ${apiResponse.status}`);
        }
        const apiData = await apiResponse.json();
        console.log('✅ API check passed:', apiData);
        
        // Test login endpoint
        const loginResponse = await fetch('http://localhost:3200/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ username: 'testuser3', password: 'password123' })
        });
        
        if (!loginResponse.ok) {
          const errorData = await loginResponse.json();
          throw new Error(`Login test failed: ${loginResponse.status} - ${JSON.stringify(errorData)}`);
        }
        
        const loginData = await loginResponse.json();
        console.log('✅ Login test passed:', loginData);
        
        setStatus('success');
        setMessage('Backend connection successful!');
        setDetails(`Health: OK, API: OK, Login: OK (token: ${loginData.accessToken?.substring(0, 20)}...)`);
        
      } catch (error) {
        console.error('❌ Backend connection failed:', error);
        setStatus('failed');
        setMessage('Backend connection failed');
        setDetails(error instanceof Error ? error.message : 'Unknown error');
      }
    };

    testConnection();
  }, []);

  const statusColors = {
    testing: 'text-blue-600 bg-blue-50 border-blue-200',
    success: 'text-green-600 bg-green-50 border-green-200',
    failed: 'text-red-600 bg-red-50 border-red-200'
  };

  return (
    <div className={`p-4 border rounded-lg mb-4 ${statusColors[status]}`}>
      <h3 className="font-bold mb-2">
        {status === 'testing' && '🔍 Testing Backend Connection...'}
        {status === 'success' && '✅ Backend Connected'}
        {status === 'failed' && '❌ Backend Connection Failed'}
      </h3>
      <p className="text-sm font-medium">{message}</p>
      <p className="text-xs mt-1">{details}</p>
    </div>
  );
}
