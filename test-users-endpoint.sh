#!/bin/bash

# Test script for the new GET /api/users endpoint
# Run this after implementing the endpoint on your backend

echo "🧪 Testing GET /api/users endpoint..."
echo "======================================="

# First, get a valid token by logging in
echo "📝 Step 1: Getting authentication token..."
TOKEN_RESPONSE=$(curl -s -X POST http://localhost:3200/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"testuser3","password":"password123"}')

echo "Login response: $TOKEN_RESPONSE"

# Extract the access token
TOKEN=$(echo $TOKEN_RESPONSE | grep -o '"accessToken":"[^"]*' | grep -o '[^"]*$')

if [ -z "$TOKEN" ]; then
  echo "❌ Failed to get authentication token. Make sure you have a valid user registered."
  echo "   You can register with:"
  echo "   curl -X POST http://localhost:3200/api/auth/register -H 'Content-Type: application/json' -d '{\"username\":\"testuser3\",\"email\":\"test3@example.com\",\"password\":\"password123\"}'"
  exit 1
fi

echo "✅ Got token: ${TOKEN:0:20}..."
echo ""

# Test the users endpoint
echo "📝 Step 2: Testing GET /api/users..."
echo "-----------------------------------"

USERS_RESPONSE=$(curl -s -X GET http://localhost:3200/api/users \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json")

echo "Users response:"
echo "$USERS_RESPONSE" | jq . 2>/dev/null || echo "$USERS_RESPONSE"
echo ""

# Test with query parameters
echo "📝 Step 3: Testing with query parameters..."
echo "-------------------------------------------"

echo "Testing ?active=true:"
curl -s -X GET "http://localhost:3200/api/users?active=true" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" | jq . 2>/dev/null || echo "Response received (jq not available for formatting)"

echo ""
echo "Testing ?role=MEMBER:"
curl -s -X GET "http://localhost:3200/api/users?role=MEMBER" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" | jq . 2>/dev/null || echo "Response received (jq not available for formatting)"

echo ""
echo "🎉 Test completed!"
