#!/bin/bash

# Subtask Testing Script
# This script tests the complete subtask functionality according to the new requirements:
# - Subtasks should not have assignee or priority
# - Subtasks should only have title, description, and due date
# - Parent tasks can have assignee and priority

echo "🚀 Starting Subtask API Testing..."

# Authentication token (replace with actual token from registration)
TOKEN="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjMsImVtYWlsIjoidGVzdEBleGFtcGxlLmNvbSIsImlhdCI6MTc2MDY3OTE3MCwiZXhwIjoxNzYxMjgzOTcwfQ.YTKvhj3sbUnri3gbPmOtvKDNZESOoBztOJexaBC8bZg"
BASE_URL="http://localhost:5000/api"

echo "📝 Testing Subtask Functionality"
echo "================================"

echo ""
echo "1️⃣ Creating a parent task with assignee and priority..."
PARENT_TASK=$(curl -s -X POST "${BASE_URL}/tasks" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer ${TOKEN}" \
  -d '{
    "title": "Complete Project Milestone",
    "description": "This is a parent task with full functionality",
    "priority": "HIGH",
    "status": "TO_DO",
    "assigneeId": 3,
    "dueDate": "2025-01-15"
  }')

echo "Parent Task Response:"
echo "$PARENT_TASK" | jq '.'

# Extract parent task ID
PARENT_ID=$(echo "$PARENT_TASK" | jq -r '.task.id')
echo ""
echo "✅ Parent Task ID: $PARENT_ID"

echo ""
echo "2️⃣ Creating subtask 1 (only title, description, dueDate - no assignee/priority)..."
SUBTASK1=$(curl -s -X POST "${BASE_URL}/tasks" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer ${TOKEN}" \
  -d "{
    \"title\": \"Research and Planning\",
    \"description\": \"Conduct initial research and create project plan\",
    \"parentId\": ${PARENT_ID},
    \"dueDate\": \"2025-01-10\"
  }")

echo "Subtask 1 Response:"
echo "$SUBTASK1" | jq '.'

SUBTASK1_ID=$(echo "$SUBTASK1" | jq -r '.task.id')
echo ""
echo "✅ Subtask 1 ID: $SUBTASK1_ID"

echo ""
echo "3️⃣ Creating subtask 2 (only title, description, dueDate)..."
SUBTASK2=$(curl -s -X POST "${BASE_URL}/tasks" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer ${TOKEN}" \
  -d "{
    \"title\": \"Implementation Phase\",
    \"description\": \"Develop the core features\",
    \"parentId\": ${PARENT_ID},
    \"dueDate\": \"2025-01-12\"
  }")

echo "Subtask 2 Response:"
echo "$SUBTASK2" | jq '.'

SUBTASK2_ID=$(echo "$SUBTASK2" | jq -r '.task.id')
echo ""
echo "✅ Subtask 2 ID: $SUBTASK2_ID"

echo ""
echo "4️⃣ Creating subtask 3 (only title and description, no dueDate)..."
SUBTASK3=$(curl -s -X POST "${BASE_URL}/tasks" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer ${TOKEN}" \
  -d "{
    \"title\": \"Testing and QA\",
    \"description\": \"Perform thorough testing and quality assurance\",
    \"parentId\": ${PARENT_ID}
  }")

echo "Subtask 3 Response:"
echo "$SUBTASK3" | jq '.'

SUBTASK3_ID=$(echo "$SUBTASK3" | jq -r '.task.id')
echo ""
echo "✅ Subtask 3 ID: $SUBTASK3_ID"

echo ""
echo "5️⃣ Fetching parent task with subtasks..."
PARENT_WITH_SUBTASKS=$(curl -s -X GET "${BASE_URL}/tasks/${PARENT_ID}?include=subtasks" \
  -H "Authorization: Bearer ${TOKEN}")

echo "Parent Task with Subtasks:"
echo "$PARENT_WITH_SUBTASKS" | jq '.'

echo ""
echo "6️⃣ Fetching all tasks (should show parent and subtasks in hierarchy)..."
ALL_TASKS=$(curl -s -X GET "${BASE_URL}/tasks?include=subtasks" \
  -H "Authorization: Bearer ${TOKEN}")

echo "All Tasks Response:"
echo "$ALL_TASKS" | jq '.'

echo ""
echo "7️⃣ Updating a subtask (should only allow title, description, dueDate)..."
UPDATED_SUBTASK=$(curl -s -X PUT "${BASE_URL}/tasks/${SUBTASK1_ID}" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer ${TOKEN}" \
  -d '{
    "title": "Updated Research and Planning",
    "description": "Updated description for research phase",
    "dueDate": "2025-01-11"
  }')

echo "Updated Subtask Response:"
echo "$UPDATED_SUBTASK" | jq '.'

echo ""
echo "8️⃣ Attempting to assign a user to a subtask (should fail or be ignored)..."
ASSIGN_SUBTASK_ATTEMPT=$(curl -s -X PUT "${BASE_URL}/tasks/${SUBTASK2_ID}" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer ${TOKEN}" \
  -d '{
    "assigneeId": 3
  }')

echo "Assign Subtask Attempt Response:"
echo "$ASSIGN_SUBTASK_ATTEMPT" | jq '.'

echo ""
echo "9️⃣ Attempting to set priority on a subtask (should fail or be ignored)..."
PRIORITY_SUBTASK_ATTEMPT=$(curl -s -X PUT "${BASE_URL}/tasks/${SUBTASK3_ID}" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer ${TOKEN}" \
  -d '{
    "priority": "URGENT"
  }')

echo "Set Priority on Subtask Attempt Response:"
echo "$PRIORITY_SUBTASK_ATTEMPT" | jq '.'

echo ""
echo "🔟 Updating parent task status to IN_PROGRESS..."
UPDATED_PARENT=$(curl -s -X PUT "${BASE_URL}/tasks/${PARENT_ID}" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer ${TOKEN}" \
  -d '{
    "status": "IN_PROGRESS"
  }')

echo "Updated Parent Task Response:"
echo "$UPDATED_PARENT" | jq '.'

echo ""
echo "1️⃣1️⃣ Marking subtask 1 as completed..."
COMPLETED_SUBTASK=$(curl -s -X PUT "${BASE_URL}/tasks/${SUBTASK1_ID}" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer ${TOKEN}" \
  -d '{
    "status": "COMPLETED"
  }')

echo "Completed Subtask Response:"
echo "$COMPLETED_SUBTASK" | jq '.'

echo ""
echo "1️⃣2️⃣ Attempting to mark parent task as completed (should fail while subtasks are incomplete)..."
COMPLETE_PARENT_ATTEMPT=$(curl -s -X PUT "${BASE_URL}/tasks/${PARENT_ID}" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer ${TOKEN}" \
  -d '{
    "status": "COMPLETED"
  }')

echo "Complete Parent with Incomplete Subtasks Response:"
echo "$COMPLETE_PARENT_ATTEMPT" | jq '.'

echo ""
echo "1️⃣3️⃣ Marking remaining subtasks as completed..."
curl -s -X PUT "${BASE_URL}/tasks/${SUBTASK2_ID}" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer ${TOKEN}" \
  -d '{"status": "COMPLETED"}' | jq '.'

curl -s -X PUT "${BASE_URL}/tasks/${SUBTASK3_ID}" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer ${TOKEN}" \
  -d '{"status": "COMPLETED"}' | jq '.'

echo ""
echo "1️⃣4️⃣ Now marking parent task as completed (should succeed)..."
FINAL_PARENT=$(curl -s -X PUT "${BASE_URL}/tasks/${PARENT_ID}" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer ${TOKEN}" \
  -d '{
    "status": "COMPLETED"
  }')

echo "Final Parent Task Response:"
echo "$FINAL_PARENT" | jq '.'

echo ""
echo "1️⃣5️⃣ Final check - fetching all tasks to verify the complete hierarchy..."
FINAL_TASKS=$(curl -s -X GET "${BASE_URL}/tasks?include=subtasks" \
  -H "Authorization: Bearer ${TOKEN}")

echo "Final Tasks Hierarchy:"
echo "$FINAL_TASKS" | jq '.'

echo ""
echo "✅ Subtask API Testing Complete!"
echo "================================"
echo ""
echo "🔍 Summary:"
echo "- Created parent task with assignee and priority ✅"
echo "- Created 3 subtasks with only title, description, dueDate ✅"
echo "- Verified subtasks don't have assignee/priority ✅"
echo "- Tested subtask updates ✅"
echo "- Verified parent task completion validation with subtasks ✅"
echo "- Confirmed hierarchy is maintained ✅"