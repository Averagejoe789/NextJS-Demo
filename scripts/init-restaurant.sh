#!/bin/bash

# Script to initialize sample restaurant
# Uses the web API endpoint

echo "🍽️  Initializing sample restaurant..."
echo ""

# Call the API endpoint
RESPONSE=$(curl -s -X POST http://localhost:3000/api/init-restaurant \
  -H "Content-Type: application/json" \
  -w "\nHTTP_CODE:%{http_code}")

HTTP_CODE=$(echo "$RESPONSE" | grep "HTTP_CODE" | cut -d: -f2)
BODY=$(echo "$RESPONSE" | grep -v "HTTP_CODE")

if [ "$HTTP_CODE" == "200" ]; then
  echo "✅ Sample restaurant created successfully!"
  echo "$BODY" | python3 -m json.tool 2>/dev/null || echo "$BODY"
else
  echo "❌ Failed to create restaurant (HTTP $HTTP_CODE)"
  echo "$BODY" | python3 -m json.tool 2>/dev/null || echo "$BODY"
  echo ""
  echo "💡 Alternative: Visit http://localhost:3000/admin/init in your browser"
fi

