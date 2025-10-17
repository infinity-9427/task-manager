### 2. Send Direct Message (Private Chat)
```bash
# First, get list of users to message
curl -X GET http://localhost:5000/api/messages/users \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

Expected response:
```json
{
  "users": [
    {
      "id": 2,
      "name": "Jane Smith",
      "email": "jane@example.com"
    },
    {
      "id": 3,
      "name": "Project Manager",
      "email": "manager@example.com"
    }
  ]
}
```

```bash
# Send direct message to user ID 2 (Jane)
curl -X POST http://localhost:5000/api/messages \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "content": "Hi Jane! How are you doing?",
    "type": "DIRECT",
    "receiverId": 2
  }'
```

Expected response:
```json
{
  "message": {
    "id": 2,
    "content": "Hi Jane! How are you doing?",
    "type": "DIRECT",
    "senderId": 1,
    "sender": {
      "id": 1,
      "name": "John Doe",
      "email": "john@example.com"
    },
    "receiverId": 2,
    "receiver": {
      "id": 2,
      "name": "Jane Smith",
      "email": "jane@example.com"
    },
    "createdAt": "2025-10-15T10:10:00.000Z"
  }
}
```

**Real-time Event**: Only Jane (user ID 2) receives this message via Socket.IO

### 3. Get General Messages (Public Chat History)
```bash
curl -X GET "http://localhost:5000/api/messages/general?page=1&limit=20" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

Expected response:
```json
{
  "messages": [
    {
      "id": 1,
      "content": "Hello everyone! 👋",
      "type": "GENERAL",
      "senderId": 1,
      "sender": {
        "id": 1,
        "name": "John Doe",
        "email": "john@example.com"
      },
      "createdAt": "2025-10-15T10:09:00.000Z"
    },
    {
      "id": 3,
      "content": "Good morning team!",
      "type": "GENERAL",
      "senderId": 2,
      "sender": {
        "id": 2,
        "name": "Jane Smith",
        "email": "jane@example.com"
      },
      "createdAt": "2025-10-15T10:11:00.000Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 2,
    "totalPages": 1
  }
}
```

### 4. Get Direct Messages with Specific User
```bash
# Get conversation with Jane (user ID 2)
curl -X GET "http://localhost:5000/api/messages/direct/2?page=1&limit=20" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

Expected response:
```json
{
  "messages": [
    {
      "id": 2,
      "content": "Hi Jane! How are you doing?",
      "type": "DIRECT",
      "senderId": 1,
      "sender": {
        "id": 1,
        "name": "John Doe",
        "email": "john@example.com"
      },
      "receiverId": 2,
      "receiver": {
        "id": 2,
        "name": "Jane Smith",
        "email": "jane@example.com"
      },
      "createdAt": "2025-10-15T10:10:00.000Z"
    },
    {
      "id": 4,
      "content": "I'm doing great! Thanks for asking 😊",
      "type": "DIRECT",
      "senderId": 2,
      "sender": {
        "id": 2,
        "name": "Jane Smith",
        "email": "jane@example.com"
      },
      "receiverId": 1,
      "receiver": {
        "id": 1,
        "name": "John Doe",
        "email": "john@example.com"
      },
      "createdAt": "2025-10-15T10:12:00.000Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 2,
    "totalPages": 1
  }
}
```

## 🔌 Real-time Socket.IO Testing

### Browser Console Test
```javascript
// Connect to Socket.IO (replace YOUR_JWT_TOKEN)
const socket = io('http://localhost:5000', {
  auth: {
    token: 'YOUR_JWT_TOKEN'
  }
});

// Listen for connection events
socket.on('connect', () => {
  console.log('Connected to messaging server');
});

// Listen for new messages
socket.on('message:received', (data) => {
  console.log('New message received:', data.message);
});

// Listen for sent message confirmation
socket.on('message:sent', (data) => {
  console.log('Message sent successfully:', data.message);
});

// Listen for user online/offline status
socket.on('user:online', (data) => {
  console.log('User came online:', data);
});

socket.on('user:offline', (data) => {
  console.log('User went offline:', data);
});

// Listen for typing indicators
socket.on('user:typing', (data) => {
  console.log('User is typing:', data);
});

socket.on('user:stop_typing', (data) => {
  console.log('User stopped typing:', data);
});

// Send typing indicators
// For general chat
socket.emit('user:typing', {});
setTimeout(() => socket.emit('user:stop_typing', {}), 3000);

// For direct message (to user ID 2)
socket.emit('user:typing', { receiverId: 2 });
setTimeout(() => socket.emit('user:stop_typing', { receiverId: 2 }), 3000);
```

### Complete Messaging Test Flow
```bash
# 1. Register two users for testing
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "alice@example.com",
    "name": "Alice Johnson",
    "password": "password123"
  }'

curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "bob@example.com",
    "name": "Bob Wilson",
    "password": "password123"
  }'

# 2. Login as Alice and get token
ALICE_TOKEN=$(curl -s -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "alice@example.com",
    "password": "password123"
  }' | grep -o '"token":"[^"]*"' | cut -d'"' -f4)

# 3. Login as Bob and get token  
BOB_TOKEN=$(curl -s -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "bob@example.com",
    "password": "password123"
  }' | grep -o '"token":"[^"]*"' | cut -d'"' -f4)

# 4. Alice sends general message
curl -X POST http://localhost:5000/api/messages \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $ALICE_TOKEN" \
  -d '{
    "content": "Hello everyone! Alice here 👋",
    "type": "GENERAL"
  }'

# 5. Bob sends general message
curl -X POST http://localhost:5000/api/messages \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $BOB_TOKEN" \
  -d '{
    "content": "Hey Alice! Bob here too 😊",
    "type": "GENERAL"
  }'

# 6. Get general chat messages
curl -X GET "http://localhost:5000/api/messages/general" \
  -H "Authorization: Bearer $ALICE_TOKEN"

# 7. Get users list (from Alice's perspective)
curl -X GET "http://localhost:5000/api/messages/users" \
  -H "Authorization: Bearer $ALICE_TOKEN"

# 8. Alice sends direct message to Bob (assuming Bob is user ID 2)
curl -X POST http://localhost:5000/api/messages \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $ALICE_TOKEN" \
  -d '{
    "content": "Hi Bob! Want to chat privately?",
    "type": "DIRECT",
    "receiverId": 2
  }'

# 9. Bob replies to Alice (assuming Alice is user ID 1)
curl -X POST http://localhost:5000/api/messages \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $BOB_TOKEN" \
  -d '{
    "content": "Sure Alice! This is our private conversation.",
    "type": "DIRECT",
    "receiverId": 1
  }'

# 10. Get direct messages between Alice and Bob
curl -X GET "http://localhost:5000/api/messages/direct/2" \
  -H "Authorization: Bearer $ALICE_TOKEN"
```

## 🔍 Error Testing

### 1. Missing Content
```bash
curl -X POST http://localhost:5000/api/messages \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "type": "GENERAL"
  }'
```
**Expected**: `400 Bad Request - Content and type are required`

### 2. Invalid Message Type
```bash
curl -X POST http://localhost:5000/api/messages \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "content": "Hello",
    "type": "INVALID_TYPE"
  }'
```
**Expected**: Validation error

### 3. Direct Message Without Receiver
```bash
curl -X POST http://localhost:5000/api/messages \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "content": "Hello",
    "type": "DIRECT"
  }'
```
**Expected**: `400 Bad Request - Receiver ID is required for direct messages`

### 4. Invalid Receiver ID
```bash
curl -X POST http://localhost:5000/api/messages \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "content": "Hello",
    "type": "DIRECT",
    "receiverId": 999
  }'
```
**Expected**: `404 Not Found - Receiver not found`

## 📊 API Endpoints Summary

### **Authentication**
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user

### **Messages**
- `POST /api/messages` - Send message (general or direct)
- `GET /api/messages/general` - Get general chat messages
- `GET /api/messages/direct/:userId` - Get direct messages with specific user
- `GET /api/messages/users` - Get list of users for direct messaging

### **Socket.IO Events**
- `message:received` - New message received
- `message:sent` - Message sent confirmation
- `user:online` - User came online
- `user:offline` - User went offline
- `user:typing` - User is typing
- `user:stop_typing` - User stopped typing

## 🧪 Simple Messaging Checklist

### **Core Functionality**
- [ ] User registration and login works
- [ ] JWT authentication protects routes
- [ ] Send general messages to public chat
- [ ] Send direct messages between users
- [ ] Get general chat message history
- [ ] Get direct message conversation history
- [ ] Get list of users for direct messaging
- [ ] Socket.IO connection established
- [ ] Real-time message delivery
- [ ] Online/offline status updates
- [ ] Typing indicators work
- [ ] Message validation and error handling

### **Real-time Features**
- [ ] General messages broadcast to all users
- [ ] Direct messages only reach intended recipient
- [ ] Typing indicators show in real-time
- [ ] User online/offline status updates
- [ ] Multiple users can connect simultaneously

## 🛠️ Package Management

This project uses **pnpm** for package management:

```bash
# Install dependencies
pnpm install

# Add new package
pnpm add package-name

# Add dev dependency
pnpm add -D package-name

# Remove package
pnpm remove package-name

# Update packages
pnpm update
```

## 📦 Socket.IO vs WebSockets

We use **Socket.IO** (not native WebSockets) because it provides:

- **Auto-reconnection**: Handles network drops gracefully
- **Room Management**: Easy group messaging and direct messaging
- **Fallback Support**: Works even with proxy/firewall restrictions
- **Built-in Authentication**: JWT integration with middleware
- **Event-based API**: Simpler than raw WebSocket messages
- **Browser Compatibility**: Works across all modern browsers

Socket.IO automatically falls back to WebSockets when available, but provides additional reliability features that raw WebSockets don't have.