const io = require('socket.io-client');

// Test real-time messaging between two users
async function testRealTimeMessaging() {
  console.log('🧪 Testing Real-time Messaging...\n');

  // You'll need to replace these with actual JWT tokens from registration/login
  const ALICE_TOKEN = 'YOUR_ALICE_JWT_TOKEN_HERE';
  const BOB_TOKEN = 'YOUR_BOB_JWT_TOKEN_HERE';

  // Connect Alice
  const aliceSocket = io('http://localhost:5000', {
    auth: { token: ALICE_TOKEN }
  });

  // Connect Bob  
  const bobSocket = io('http://localhost:5000', {
    auth: { token: BOB_TOKEN }
  });

  // Alice listens for messages
  aliceSocket.on('connect', () => {
    console.log('✅ Alice connected');
  });

  aliceSocket.on('message:received', (data) => {
    console.log('📨 Alice received message:', data.message.content);
    console.log('   From:', data.message.sender.name);
    console.log('   Type:', data.message.type);
  });

  aliceSocket.on('user:online', (data) => {
    console.log('🟢 Alice sees user online:', data.email);
  });

  // Bob listens for messages
  bobSocket.on('connect', () => {
    console.log('✅ Bob connected');
  });

  bobSocket.on('message:received', (data) => {
    console.log('📨 Bob received message:', data.message.content);
    console.log('   From:', data.message.sender.name);
    console.log('   Type:', data.message.type);
  });

  bobSocket.on('message:sent', (data) => {
    console.log('✅ Bob\'s message sent confirmation:', data.message.content);
  });

  bobSocket.on('user:online', (data) => {
    console.log('🟢 Bob sees user online:', data.email);
  });

  // Test typing indicators
  aliceSocket.on('user:typing', (data) => {
    console.log('⌨️ Alice sees typing:', data.email);
  });

  bobSocket.on('user:typing', (data) => {
    console.log('⌨️ Bob sees typing:', data.email);
  });

  console.log('\n🔗 Sockets connected. You can now:');
  console.log('1. Send messages via API endpoints');
  console.log('2. See real-time delivery here');
  console.log('3. Test typing indicators');
  console.log('\nPress Ctrl+C to exit\n');
}

// Instructions
console.log('📋 SETUP INSTRUCTIONS:');
console.log('1. Start the backend server: pnpm run dev');
console.log('2. Register two users via API');
console.log('3. Get their JWT tokens');
console.log('4. Replace ALICE_TOKEN and BOB_TOKEN above');
console.log('5. Run: node test-messaging.js');
console.log('6. Send messages via curl/API and watch real-time delivery\n');

testRealTimeMessaging().catch(console.error);