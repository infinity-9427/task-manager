const io = require('socket.io-client');
const axios = require('axios');

async function simpleTest() {
  console.log('🧪 Simple Socket Test...');

  try {
    // Login to get token
    console.log('📝 Logging in...');
    const loginResponse = await axios.post('http://localhost:5000/api/auth/login', {
      email: 'test@example.com',
      password: 'password123'
    }).catch(async () => {
      // If login fails, try to register
      console.log('📝 Registering new user...');
      return await axios.post('http://localhost:5000/api/auth/register', {
        name: 'Test User',
        email: 'test@example.com',
        password: 'password123'
      });
    });

    const token = loginResponse.data.token;
    console.log('✅ Authentication successful');

    // Connect to socket
    console.log('🔌 Connecting to Socket.IO...');
    const socket = io('http://localhost:5000', {
      auth: { token }
    });

    socket.on('connect', () => {
      console.log('✅ Socket connected successfully');
      
      // Test sending a general message
      console.log('📤 Sending test message...');
      socket.emit('message:send', {
        content: 'Hello World! This is a test message.',
        type: 'GENERAL'
      });
    });

    socket.on('message:sent', (data) => {
      console.log('✅ Message sent confirmation received:', data.message.content);
    });

    socket.on('message:received', (data) => {
      console.log('📨 Message received:', data.message.content);
      console.log('   From:', data.message.sender.name);
      console.log('   Type:', data.message.type);
      
      // Test completed successfully
      console.log('🎉 Test completed successfully!');
      socket.disconnect();
      process.exit(0);
    });

    socket.on('connect_error', (error) => {
      console.error('❌ Connection error:', error.message);
      process.exit(1);
    });

    socket.on('error', (error) => {
      console.error('❌ Socket error:', error);
      process.exit(1);
    });

    // Timeout after 10 seconds
    setTimeout(() => {
      console.log('⏰ Test timeout - something might be wrong');
      socket.disconnect();
      process.exit(1);
    }, 10000);

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    process.exit(1);
  }
}

simpleTest();