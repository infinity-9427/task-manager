# Quick Curl Tests for Subtask Functionality

## Authentication
First register and get a token:
```bash
# Register user
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test User",
    "email": "test2@example.com",
    "password": "password123"
  }'

# Login to get token
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test2@example.com",
    "password": "password123"
  }'
```

**Replace TOKEN in examples below with your actual token.**

## 1. Create Parent Task
```bash
curl -X POST http://localhost:5000/api/tasks \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "title": "Build New Feature",
    "description": "Develop a comprehensive new feature for the application",
    "priority": "HIGH",
    "status": "TO_DO",
    "assigneeId": 3,
    "dueDate": "2025-02-01"
  }'
```

## 2. Create Subtask (No Assignee/Priority)
```bash
# Note: Even if you pass assigneeId/priority, they will be ignored for subtasks
curl -X POST http://localhost:5000/api/tasks \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "title": "Create Database Schema",
    "description": "Design and implement the database schema",
    "status": "TO_DO",
    "priority": "MEDIUM",
    "parentId": PARENT_TASK_ID,
    "dueDate": "2025-01-20"
  }'
```

## 3. Get Parent Task with Subtasks
```bash
curl -X GET "http://localhost:5000/api/tasks/PARENT_TASK_ID?include=subtasks" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

## 4. Get All Tasks (Hierarchy)
```bash
curl -X GET "http://localhost:5000/api/tasks?include=subtasks" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

## 5. Update Subtask (Valid Fields Only)
```bash
# This works - title, description, dueDate
curl -X PUT http://localhost:5000/api/tasks/SUBTASK_ID \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "title": "Updated Database Schema Design",
    "description": "Updated description with more details",
    "dueDate": "2025-01-22"
  }'
```

## 6. Try to Assign Subtask (Should Fail)
```bash
# This should fail with error message
curl -X PUT http://localhost:5000/api/tasks/SUBTASK_ID \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "assigneeId": 3
  }'
```

## 7. Try to Set Priority on Subtask (Should Fail)
```bash
# This should fail with error message
curl -X PUT http://localhost:5000/api/tasks/SUBTASK_ID \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "priority": "URGENT"
  }'
```

## 8. Update Task Status
```bash
# Mark subtask as in progress
curl -X PUT http://localhost:5000/api/tasks/SUBTASK_ID \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "status": "IN_PROGRESS"
  }'

# Mark subtask as completed
curl -X PUT http://localhost:5000/api/tasks/SUBTASK_ID \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "status": "COMPLETED"
  }'
```

## 9. Try to Complete Parent with Incomplete Subtasks (Should Fail)
```bash
# This should fail with validation error
curl -X PUT http://localhost:5000/api/tasks/PARENT_TASK_ID \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "status": "COMPLETED"
  }'
```

## 10. Complete Parent After All Subtasks Done (Should Succeed)
```bash
# After all subtasks are completed, this should work
curl -X PUT http://localhost:5000/api/tasks/PARENT_TASK_ID \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "status": "COMPLETED"
  }'
```

## Expected Results

### ✅ What Works:
- Parent tasks have assigneeId and priority
- Subtasks are created with assigneeId=null (no assignee)
- Subtasks maintain a default priority but cannot be changed
- Subtasks can be updated with title, description, dueDate
- Status updates work for both parent and subtasks
- Parent task completion is blocked if subtasks are incomplete
- Parent task can be completed when all subtasks are done

### ❌ What Should Fail:
- Trying to assign a user to a subtask
- Trying to change priority of a subtask
- Completing parent task while subtasks are incomplete

### 🔍 Key Observations:
- `assigneeId` is `null` for all subtasks
- `priority` exists but cannot be modified for subtasks
- `parentId` properly links subtasks to parent
- Hierarchy is maintained in responses
- Validation prevents invalid operations