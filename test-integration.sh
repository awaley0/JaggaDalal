#!/bin/bash
# Frontend & Backend Integration Test Script
# This script tests all critical integration points

echo "╔════════════════════════════════════════════════════════════╗"
echo "║  🧪 FYP Frontend & Backend Integration Test               ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo ""

# Color codes
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Test 1: Backend Health Check
echo "${YELLOW}[1/5]${NC} Testing Backend Health Check..."
RESPONSE=$(curl -s -w "\n%{http_code}" http://localhost:5000)
HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
BODY=$(echo "$RESPONSE" | head -n-1)

if [ "$HTTP_CODE" = "200" ]; then
    echo "${GREEN}✅ Backend is running on http://localhost:5000${NC}"
    echo "   Response: $BODY"
else
    echo "${RED}❌ Backend health check failed${NC}"
    echo "   Make sure: mongod is running and 'npm run dev' in Backend folder"
fi
echo ""

# Test 2: Frontend Health Check  
echo "${YELLOW}[2/5]${NC} Testing Frontend Health Check..."
RESPONSE=$(curl -s -w "\n%{http_code}" http://localhost:5173 2>/dev/null)
HTTP_CODE=$(echo "$RESPONSE" | tail -n1)

if [ "$HTTP_CODE" = "200" ]; then
    echo "${GREEN}✅ Frontend is running on http://localhost:5173${NC}"
else
    echo "${RED}❌ Frontend is not responding${NC}"
    echo "   Make sure: 'npm run dev' in Frontend folder"
fi
echo ""

# Test 3: API Signup Endpoint
echo "${YELLOW}[3/5]${NC} Testing API Signup Endpoint..."
TEST_EMAIL="test_$(date +%s)@example.com"
RESPONSE=$(curl -s -X POST http://localhost:5000/api/auth/signup \
  -H "Content-Type: application/json" \
  -d "{
    \"name\": \"Test User\",
    \"email\": \"$TEST_EMAIL\",
    \"password\": \"password123\",
    \"role\": \"buyer\"
  }" -w "\n%{http_code}")

HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
BODY=$(echo "$RESPONSE" | head -n-1)

if [ "$HTTP_CODE" = "201" ] || [ "$HTTP_CODE" = "200" ]; then
    echo "${GREEN}✅ Signup API working correctly${NC}"
    if echo "$BODY" | grep -q '"token"'; then
        echo "   ✅ Token generated successfully"
    fi
else
    echo "${RED}❌ Signup API failed (HTTP $HTTP_CODE)${NC}"
    echo "   Response: $BODY"
fi
echo ""

# Test 4: Login Endpoint
echo "${YELLOW}[4/5]${NC} Testing API Login Endpoint..."
RESPONSE=$(curl -s -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d "{
    \"email\": \"$TEST_EMAIL\",
    \"password\": \"password123\"
  }" -w "\n%{http_code}")

HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
BODY=$(echo "$RESPONSE" | head -n-1)

if [ "$HTTP_CODE" = "200" ]; then
    echo "${GREEN}✅ Login API working correctly${NC}"
    if echo "$BODY" | grep -q '"token"'; then
        echo "   ✅ Token returned for login"
    fi
else
    echo "${RED}❌ Login API failed (HTTP $HTTP_CODE)${NC}"
fi
echo ""

# Test 5: CORS Configuration
echo "${YELLOW}[5/5]${NC} Testing CORS Configuration..."
RESPONSE=$(curl -s -I -H "Origin: http://localhost:5173" http://localhost:5000/api/auth/login)

if echo "$RESPONSE" | grep -q "Access-Control-Allow-Origin"; then
    echo "${GREEN}✅ CORS is properly configured${NC}"
else
    echo "${YELLOW}⚠️  CORS headers not found (might be OK for POST requests)${NC}"
fi
echo ""

# Summary
echo "╔════════════════════════════════════════════════════════════╗"
echo "║  🎯 Integration Test Complete                             ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo ""
echo "📝 Next Steps:"
echo "  1. Open http://localhost:5173 in your browser"
echo "  2. Click 'Sign Up' and create a new account"
echo "  3. Verify redirection to home page"
echo "  4. Open DevTools (F12) → Application → localStorage"
echo "  5. Check that 'token' and 'user' are stored"
echo ""
