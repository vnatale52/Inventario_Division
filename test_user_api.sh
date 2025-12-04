#!/bin/bash

echo "Testing User Management API..."
echo ""

# Test login
echo "1. Testing admin login..."
TOKEN=$(curl -s -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"password123"}' | grep -o '"token":"[^"]*' | cut -d'"' -f4)

if [ -z "$TOKEN" ]; then
  echo "❌ Login failed"
  exit 1
fi

echo "✅ Login successful"
echo ""

# Test GET /api/users
echo "2. Testing GET /api/users..."
curl -s -X GET http://localhost:3001/api/users \
  -H "Authorization: Bearer $TOKEN" | jq '.'

echo ""
echo "✅ User management API test complete"
