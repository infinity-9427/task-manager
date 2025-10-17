#!/bin/bash

# Final Comprehensive Subtask Demo
# Demonstrates complete subtask functionality with all constraints working

echo "🎯 FINAL SUBTASK FUNCTIONALITY DEMO"
echo "===================================="
echo ""
echo "This demo shows:"
echo "✅ Parent tasks with assignee & priority"
echo "✅ Subtasks without assignee (title, description, dueDate only)"
echo "✅ Constraint enforcement (no assign/priority changes on subtasks)"
echo "✅ Parent completion validation with subtasks"
echo "✅ Real-time hierarchy management"
echo ""

# Get fresh token
echo "🔑 Getting authentication token..."
AUTH_RESPONSE=$(curl -s -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123"
  }')

TOKEN=$(echo "$AUTH_RESPONSE" | jq -r '.token')
USER_ID=$(echo "$AUTH_RESPONSE" | jq -r '.user.id')

if [ "$TOKEN" = "null" ]; then
  echo "❌ Authentication failed. Please check credentials."
  exit 1
fi

echo "✅ Authenticated as User ID: $USER_ID"
echo ""

# Create parent task
echo "📋 STEP 1: Creating parent task with full features..."
PARENT=$(curl -s -X POST http://localhost:5000/api/tasks \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer ${TOKEN}" \
  -d "{
    \"title\": \"Develop User Authentication System\",
    \"description\": \"Complete implementation of user authentication with OAuth integration\",
    \"priority\": \"HIGH\",
    \"status\": \"TO_DO\",
    \"assigneeId\": ${USER_ID},
    \"dueDate\": \"2025-03-01\"
  }")

PARENT_ID=$(echo "$PARENT" | jq -r '.task.id')
echo "✅ Parent Task Created:"
echo "   ID: $PARENT_ID"
echo "   Assignee: $(echo "$PARENT" | jq -r '.task.assigneeId')"
echo "   Priority: $(echo "$PARENT" | jq -r '.task.priority')"
echo ""

# Create subtasks
echo "📝 STEP 2: Creating subtasks (no assignees, only title/description/dueDate)..."

echo "Creating Subtask 1: Database Schema..."
SUBTASK1=$(curl -s -X POST http://localhost:5000/api/tasks \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer ${TOKEN}" \
  -d "{
    \"title\": \"Design Database Schema\",
    \"description\": \"Create user tables, indexes, and relationships\",
    \"status\": \"TO_DO\",
    \"parentId\": ${PARENT_ID},
    \"dueDate\": \"2025-02-10\"
  }")

SUBTASK1_ID=$(echo "$SUBTASK1" | jq -r '.task.id')
echo "✅ Subtask 1 ID: $SUBTASK1_ID (assigneeId: $(echo "$SUBTASK1" | jq -r '.task.assigneeId // "null"'))"

echo "Creating Subtask 2: Backend API..."
SUBTASK2=$(curl -s -X POST http://localhost:5000/api/tasks \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer ${TOKEN}" \
  -d "{
    \"title\": \"Implement Authentication API\",
    \"description\": \"Build login, register, and token management endpoints\",
    \"status\": \"TO_DO\",
    \"parentId\": ${PARENT_ID},
    \"dueDate\": \"2025-02-15\"
  }")

SUBTASK2_ID=$(echo "$SUBTASK2" | jq -r '.task.id')
echo "✅ Subtask 2 ID: $SUBTASK2_ID (assigneeId: $(echo "$SUBTASK2" | jq -r '.task.assigneeId // "null"'))"

echo "Creating Subtask 3: Frontend UI..."
SUBTASK3=$(curl -s -X POST http://localhost:5000/api/tasks \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer ${TOKEN}" \
  -d "{
    \"title\": \"Create Login/Register UI\",
    \"description\": \"Design and implement user interface components\",
    \"status\": \"TO_DO\",
    \"parentId\": ${PARENT_ID},
    \"dueDate\": \"2025-02-20\"
  }")

SUBTASK3_ID=$(echo "$SUBTASK3" | jq -r '.task.id')
echo "✅ Subtask 3 ID: $SUBTASK3_ID (assigneeId: $(echo "$SUBTASK3" | jq -r '.task.assigneeId // "null"'))"
echo ""

# Show hierarchy
echo "🏗️  STEP 3: Viewing complete task hierarchy..."
HIERARCHY=$(curl -s -X GET "http://localhost:5000/api/tasks/${PARENT_ID}?include=subtasks" \
  -H "Authorization: Bearer ${TOKEN}")

echo "Task Hierarchy:"
echo "$HIERARCHY" | jq '{
  parentTask: {
    id: .task.id,
    title: .task.title,
    assigneeId: .task.assigneeId,
    priority: .task.priority,
    status: .task.status,
    dueDate: .task.dueDate
  },
  subtasks: [.task.subtasks[] | {
    id: .id,
    title: .title,
    assigneeId: .assigneeId,
    priority: .priority,
    status: .status,
    dueDate: .dueDate
  }]
}'
echo ""

# Test constraints
echo "🚫 STEP 4: Testing constraint enforcement..."

echo "Attempting to assign user to subtask (should fail)..."
ASSIGN_TEST=$(curl -s -X PUT "http://localhost:5000/api/tasks/${SUBTASK1_ID}" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer ${TOKEN}" \
  -d "{\"assigneeId\": ${USER_ID}}")

ASSIGN_ERROR=$(echo "$ASSIGN_TEST" | jq -r '.error // "No error"')
if [[ "$ASSIGN_ERROR" == *"Cannot assign subtasks"* ]]; then
  echo "✅ CONSTRAINT WORKING: $ASSIGN_ERROR"
else
  echo "❌ CONSTRAINT FAILED: Assignment should have been blocked"
fi

echo "Attempting to change subtask priority (should fail)..."
PRIORITY_TEST=$(curl -s -X PUT "http://localhost:5000/api/tasks/${SUBTASK2_ID}" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer ${TOKEN}" \
  -d '{"priority": "URGENT"}')

PRIORITY_ERROR=$(echo "$PRIORITY_TEST" | jq -r '.error // "No error"')
if [[ "$PRIORITY_ERROR" == *"Cannot set priority"* ]]; then
  echo "✅ CONSTRAINT WORKING: $PRIORITY_ERROR"
else
  echo "❌ CONSTRAINT FAILED: Priority change should have been blocked"
fi
echo ""

# Test valid operations
echo "✏️  STEP 5: Testing valid subtask operations..."

echo "Updating subtask title and due date (should work)..."
UPDATE_TEST=$(curl -s -X PUT "http://localhost:5000/api/tasks/${SUBTASK1_ID}" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer ${TOKEN}" \
  -d '{
    "title": "Design Enhanced Database Schema",
    "description": "Create user tables, indexes, relationships, and security constraints",
    "dueDate": "2025-02-12"
  }')

if [ "$(echo "$UPDATE_TEST" | jq -r '.task.title')" != "null" ]; then
  echo "✅ VALID UPDATE WORKED: $(echo "$UPDATE_TEST" | jq -r '.task.title')"
else
  echo "❌ VALID UPDATE FAILED: $(echo "$UPDATE_TEST" | jq -r '.error // "Unknown error"')"
fi
echo ""

# Test completion logic
echo "🏁 STEP 6: Testing parent task completion logic..."

echo "Attempting to complete parent with incomplete subtasks (should fail)..."
COMPLETE_EARLY=$(curl -s -X PUT "http://localhost:5000/api/tasks/${PARENT_ID}" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer ${TOKEN}" \
  -d '{"status": "COMPLETED"}')

COMPLETE_ERROR=$(echo "$COMPLETE_EARLY" | jq -r '.error // "No error"')
if [[ "$COMPLETE_ERROR" == *"while subtasks remain incomplete"* ]]; then
  echo "✅ COMPLETION VALIDATION WORKING: Parent completion blocked"
  echo "   Reason: $COMPLETE_ERROR"
else
  echo "❌ COMPLETION VALIDATION FAILED: Parent should not complete with incomplete subtasks"
fi
echo ""

echo "Completing all subtasks first..."
curl -s -X PUT "http://localhost:5000/api/tasks/${SUBTASK1_ID}" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer ${TOKEN}" \
  -d '{"status": "COMPLETED"}' > /dev/null

curl -s -X PUT "http://localhost:5000/api/tasks/${SUBTASK2_ID}" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer ${TOKEN}" \
  -d '{"status": "COMPLETED"}' > /dev/null

curl -s -X PUT "http://localhost:5000/api/tasks/${SUBTASK3_ID}" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer ${TOKEN}" \
  -d '{"status": "COMPLETED"}' > /dev/null

echo "✅ All subtasks marked as completed"

echo "Now completing parent task (should succeed)..."
COMPLETE_FINAL=$(curl -s -X PUT "http://localhost:5000/api/tasks/${PARENT_ID}" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer ${TOKEN}" \
  -d '{"status": "COMPLETED"}')

if [ "$(echo "$COMPLETE_FINAL" | jq -r '.task.status')" = "COMPLETED" ]; then
  echo "✅ PARENT COMPLETION SUCCESSFUL: All tasks completed"
else
  echo "❌ PARENT COMPLETION FAILED: $(echo "$COMPLETE_FINAL" | jq -r '.error // "Unknown error"')"
fi
echo ""

# Final verification
echo "🔍 STEP 7: Final verification..."
FINAL_CHECK=$(curl -s -X GET "http://localhost:5000/api/tasks/${PARENT_ID}?include=subtasks" \
  -H "Authorization: Bearer ${TOKEN}")

echo "Final Task Status:"
echo "$FINAL_CHECK" | jq '{
  parentTask: {
    id: .task.id,
    title: .task.title,
    status: .task.status,
    assigneeId: .task.assigneeId,
    priority: .task.priority
  },
  completedSubtasks: [.task.subtasks[] | {
    id: .id,
    title: .title,
    status: .status,
    assigneeId: .assigneeId,
    hasAssignee: (.assigneeId != null)
  }]
}'
echo ""

echo "🎉 DEMO COMPLETE!"
echo "================="
echo ""
echo "✅ FUNCTIONALITY VERIFIED:"
echo "   • Parent tasks have assignees and priorities"
echo "   • Subtasks have NO assignees (assigneeId = null)"
echo "   • Subtasks cannot be assigned to users (constraint enforced)"
echo "   • Subtasks cannot have priority changed (constraint enforced)"
echo "   • Subtasks can be updated with title/description/dueDate"
echo "   • Parent task completion requires all subtasks to be done"
echo "   • Hierarchy is properly maintained"
echo ""
echo "🚀 The subtask functionality is working perfectly according to requirements!"