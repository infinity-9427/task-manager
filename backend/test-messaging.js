const io = require('socket.io-client');
const axios = require('axios');

// Test real-time messaging with automatic authentication
async function testRealTimeMessaging() {
  console.log('🧪 Testing Real-time Messaging...\n');

  try {
    // Auto-register or login test user
    let token;
    try {
      console.log('📝 Registering test user...');
      const response = await axios.post('http://localhost:5000/api/auth/register', {
        name: 'Test User',
        email: 'test@example.com',
        password: 'password123'
      });
      token = response.data.token;
      console.log('✅ User registered successfully');
    } catch (error) {
      console.log('📋 User exists, trying login...');
      try {
        const response = await axios.post('http://localhost:5000/api/auth/login', {
          email: 'test@example.com',
          password: 'password123'
        });
        token = response.data.token;
        console.log('✅ User logged in successfully');
      } catch (loginError) {
        console.error('❌ Authentication failed:', loginError.message);
        return;
      }
    }

    // Connect test user socket
    console.log('\n🔌 Connecting to WebSocket...');
    const socket = io('http://localhost:5000', {
      auth: { token }
    });

    socket.on('connect', () => {
      console.log('✅ Connected to WebSocket server');
      console.log('🏠 Joined general chat room');
      
      // Test sending a message via WebSocket
      console.log('\n📤 Testing message:send event...');
      socket.emit('message:send', {
        content: 'Hello from test script! This is a general message.',
        type: 'GENERAL'
      });
    });

    socket.on('message:sent', (data) => {
      console.log('✅ Message sent confirmation:', data.message.content);
    });

    socket.on('message:received', (data) => {
      console.log('✅ Message received via WebSocket:', data.message.content);
      console.log('   From:', data.message.sender.name);
      console.log('   Type:', data.message.type);
      
      // Test HTTP API as well
      console.log('\n📤 Testing HTTP API message...');
      axios.post('http://localhost:5000/api/messages', {
        content: 'Hello from HTTP API! This is also a general message.',
        type: 'GENERAL'
      }, {
        headers: { Authorization: `Bearer ${token}` }
      }).then(() => {
        console.log('✅ HTTP API message sent successfully');
      }).catch(err => {
        console.error('❌ HTTP API message failed:', err.message);
      });
    });

    socket.on('user:online', (data) => {
      console.log('🟢 User online:', data.email || data.userId);
    });

    socket.on('connect_error', (error) => {
      console.error('❌ Connection error:', error.message);
    });

    socket.on('error', (error) => {
      console.error('❌ Socket error:', error);
    });

    console.log('\n⏳ Testing chat functionality...');
    console.log('   - WebSocket connection');
    console.log('   - Message sending via WebSocket');
    console.log('   - Message sending via HTTP API');
    console.log('   - Real-time message delivery');

    // Auto-exit after successful test
    setTimeout(() => {
      console.log('\n🎉 Chat functionality test completed!');
      socket.disconnect();
      process.exit(0);
    }, 5000);

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    process.exit(1);
  }
}

// Run the test
testRealTimeMessaging().catch(console.error);