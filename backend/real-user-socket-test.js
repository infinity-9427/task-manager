const io = require('socket.io-client');
const axios = require('axios');

async function testWithRealUsers() {
  console.log('🧪 Testing Socket Chat with Real Database Users...\n');

  try {
    // Login as John Doe
    console.log('📝 Logging in as John Doe...');
    const johnResponse = await axios.post('http://localhost:5000/api/auth/login', {
      email: 'john@example.com',
      password: 'password123'
    });
    const johnToken = johnResponse.data.token;
    console.log('✅ John Doe authenticated');

    // Login as Alice Smith
    console.log('📝 Logging in as Alice Smith...');
    const aliceResponse = await axios.post('http://localhost:5000/api/auth/login', {
      email: 'alice@example.com',
      password: 'password123'
    });
    const aliceToken = aliceResponse.data.token;
    console.log('✅ Alice Smith authenticated');

    // Connect John's socket
    console.log('\n🔌 Connecting John to Socket.IO...');
    const johnSocket = io('http://localhost:5000', {
      auth: { token: johnToken }
    });

    // Connect Alice's socket
    console.log('🔌 Connecting Alice to Socket.IO...');
    const aliceSocket = io('http://localhost:5000', {
      auth: { token: aliceToken }
    });

    let johnConnected = false;
    let aliceConnected = false;
    let messagesReceived = 0;

    johnSocket.on('connect', () => {
      console.log('✅ John connected to socket');
      johnConnected = true;
      checkAndSendMessages();
    });

    aliceSocket.on('connect', () => {
      console.log('✅ Alice connected to socket');
      aliceConnected = true;
      checkAndSendMessages();
    });

    function checkAndSendMessages() {
      if (johnConnected && aliceConnected) {
        console.log('\n📤 Both users connected! Starting message exchange...');
        
        // John sends a message
        setTimeout(() => {
          console.log('📤 John sending message...');
          johnSocket.emit('message:send', {
            content: 'Hello Alice! This is John via socket connection.',
            type: 'GENERAL'
          });
        }, 500);

        // Alice sends a message
        setTimeout(() => {
          console.log('📤 Alice sending message...');
          aliceSocket.emit('message:send', {
            content: 'Hi John! Alice here, receiving your message loud and clear!',
            type: 'GENERAL'
          });
        }, 1500);
      }
    }

    // Listen for messages on both sockets
    johnSocket.on('message:received', (data) => {
      console.log(`📨 John received: "${data.message.content}" from ${data.message.sender.name}`);
      messagesReceived++;
      checkTestComplete();
    });

    aliceSocket.on('message:received', (data) => {
      console.log(`📨 Alice received: "${data.message.content}" from ${data.message.sender.name}`);
      messagesReceived++;
      checkTestComplete();
    });

    johnSocket.on('message:sent', (data) => {
      console.log('✅ John message sent confirmation received');
    });

    aliceSocket.on('message:sent', (data) => {
      console.log('✅ Alice message sent confirmation received');
    });

    function checkTestComplete() {
      if (messagesReceived >= 2) {
        console.log('\n🎉 Real-time socket chat test completed successfully!');
        console.log('✅ Both users can send and receive messages in real-time');
        console.log('✅ General chat functionality working with real database users');
        
        johnSocket.disconnect();
        aliceSocket.disconnect();
        process.exit(0);
      }
    }

    // Error handling
    johnSocket.on('connect_error', (error) => {
      console.error('❌ John connection error:', error.message);
    });

    aliceSocket.on('connect_error', (error) => {
      console.error('❌ Alice connection error:', error.message);
    });

    // Timeout after 15 seconds
    setTimeout(() => {
      console.log('⏰ Test timeout - might need investigation');
      johnSocket.disconnect();
      aliceSocket.disconnect();
      process.exit(1);
    }, 15000);

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    process.exit(1);
  }
}

testWithRealUsers();