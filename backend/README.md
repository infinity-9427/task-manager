# Task Management API - Backend

A collaborative task management system built with DDD architecture, TypeScript, and real-time features.

## 🏗️ Architecture

### Domain-Driven Design (DDD)
```
src/
├── domain/              # Business entities and logic
│   ├── task/entities/   # Task entity
│   └── user/entities/   # User entity
├── application/         # Use cases and services
│   └── services/        # Business logic services
├── infrastructure/      # External concerns
│   ├── config/          # Database, JWT configuration
│   └── socket/          # Socket.IO implementation
├── presentation/        # API layer
│   ├── controllers/     # Request handlers
│   ├── routes/          # Route definitions
│   └── middleware/      # Authentication, validation
└── shared/             # Common types and utilities
    └── types/          # Enums, interfaces
```

## 🚀 Features

- **CRUD Operations**: Complete task and subtask management
- **Real-time Sync**: Socket.IO for live updates (<2s latency)
- **Authentication**: JWT-based auth with bcrypt
- **Business Rules**: Parent task completion validation
- **Database**: PostgreSQL with TypeORM
- **TypeScript**: Full type safety

## 📊 Database Schema

### Task Entity
- `id` (PK)
- `title` (required)
- `description` (optional)
- `status` (TO_DO | IN_PROGRESS | COMPLETED)
- `priority` (LOW | MEDIUM | HIGH | URGENT)
- `parentId` (FK, optional for subtasks)
- `assigneeId` (FK)
- `createdById` (FK)
- `createdAt`, `updatedAt`

### User Entity
- `id` (PK)
- `email` (unique)
- `name`
- `password` (hashed)
- `createdAt`, `updatedAt`

## 🔧 Setup

1. **Install dependencies**:
   ```bash
   pnpm install
   ```

2. **Environment variables**:
   ```bash
   # .env
   NEON_CONNECTION=postgresql://user:pass@host/db
   JWT_SECRET=your-secret-key
   PORT=5000
   ```

3. **Start development**:
   ```bash
   pnpm run dev
   ```

## 📡 API Endpoints

### Authentication
```http
POST /api/auth/register
Content-Type: application/json

{
  "email": "user@example.com",
  "name": "John Doe",
  "password": "password123"
}
```

```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123"
}
```

### Tasks (Requires Bearer Token)
```http
# Get all tasks
GET /api/tasks?include=subtasks&status=TO_DO&assignee=1&page=1&limit=10

# Get task by ID
GET /api/tasks/:id

# Create task
POST /api/tasks
Content-Type: application/json
Authorization: Bearer <token>

{
  "title": "Task title",
  "description": "Task description",
  "status": "TO_DO",
  "priority": "HIGH",
  "parentId": null,
  "assigneeId": 1
}

# Update task
PUT /api/tasks/:id
Content-Type: application/json
Authorization: Bearer <token>

{
  "title": "Updated title",
  "status": "COMPLETED"
}

# Delete task
DELETE /api/tasks/:id
Authorization: Bearer <token>
```

## ⚡ Real-time Events

### Client → Server
- `join` - Join a room for updates
- `leave` - Leave a room
- `task:editing:start` - Start editing a task
- `task:editing:stop` - Stop editing a task

### Server → Client
- `task:created` - New task created
- `task:updated` - Task updated
- `task:deleted` - Task deleted
- `task:editing` - Someone is editing a task

### Socket.IO Connection
```javascript
import io from 'socket.io-client';

const socket = io('http://localhost:5000', {
  auth: {
    token: 'your-jwt-token'
  }
});

// Listen for task updates
socket.on('task:updated', (data) => {
  console.log('Task updated:', data);
});

// Join a room for real-time updates
socket.emit('join', 'tasks');
```

## 🔒 Business Rules

1. **Parent Task Completion**: Cannot mark parent task as COMPLETED if any subtask is not COMPLETED
2. **Cascade Delete**: Deleting a parent task removes all subtasks
3. **User Validation**: Assignee must exist in the system
4. **Authentication**: All task operations require valid JWT token

## 🧪 Testing the API

### 1. Register a user
```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","name":"Test User","password":"password123"}'
```

### 2. Login and get token
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123"}'
```

### 3. Create a task
```bash
curl -X POST http://localhost:5000/api/tasks \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{"title":"My First Task","description":"This is a test task","priority":"HIGH"}'
```

### 4. Get all tasks
```bash
curl -X GET "http://localhost:5000/api/tasks?include=subtasks" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

## 🔄 Real-time Testing

Use a WebSocket client or browser console:

```javascript
// Connect to Socket.IO
const socket = io('http://localhost:5000', {
  auth: { token: 'YOUR_JWT_TOKEN' }
});

// Listen for events
socket.on('task:created', console.log);
socket.on('task:updated', console.log);
socket.on('task:deleted', console.log);

// Join tasks room
socket.emit('join', 'tasks');
```

## 🚦 Health Check

```bash
curl http://localhost:5000/health
```

## 🏃‍♂️ Scripts

- `pnpm run dev` - Start development server with watch mode
- `pnpm run build` - Build for production
- `pnpm run start` - Start production server
- `pnpm run typecheck` - Run TypeScript checks