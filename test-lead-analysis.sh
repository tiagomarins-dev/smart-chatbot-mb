#!/bin/bash

# Test script for lead analysis API endpoint

# Color codes for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${YELLOW}Testing Lead Analysis API Endpoint${NC}"
echo "======================================"

# API endpoint
API_URL="http://localhost:9033/api/leads"

# Test credentials
EMAIL="user@example.com"
PASSWORD="password123"

# First, login to get auth token
echo -e "\n${YELLOW}1. Logging in to get auth token...${NC}"
LOGIN_RESPONSE=$(curl -s -X POST \
  ${API_URL%/api/leads}/api/auth/login \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"${EMAIL}\",\"password\":\"${PASSWORD}\"}")

# Extract token from response
TOKEN=$(echo $LOGIN_RESPONSE | grep -o '"token":"[^"]*' | cut -d'"' -f4)

if [ -z "$TOKEN" ]; then
  echo -e "${RED}Failed to get auth token. Login response:${NC}"
  echo $LOGIN_RESPONSE
  exit 1
fi

echo -e "${GREEN}✓ Auth token obtained${NC}"

# Get list of leads first
echo -e "\n${YELLOW}2. Getting list of leads...${NC}"
LEADS_RESPONSE=$(curl -s -X GET \
  $API_URL \
  -H "Authorization: Bearer $TOKEN")

# Extract first lead ID from response
LEAD_ID=$(echo $LEADS_RESPONSE | grep -o '"id":"[^"]*' | head -1 | cut -d'"' -f4)

if [ -z "$LEAD_ID" ]; then
  echo -e "${RED}No leads found to analyze${NC}"
  echo "Response: $LEADS_RESPONSE"
  exit 1
fi

echo -e "${GREEN}✓ Found lead ID: $LEAD_ID${NC}"

# Test lead analysis endpoint
echo -e "\n${YELLOW}3. Analyzing lead $LEAD_ID...${NC}"
ANALYSIS_RESPONSE=$(curl -s -X POST \
  "$API_URL/$LEAD_ID/analyze" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json")

# Check if response contains expected fields
if echo $ANALYSIS_RESPONSE | grep -q "sentiment_status"; then
  echo -e "${GREEN}✓ Lead analysis successful!${NC}"
  echo -e "\n${YELLOW}Analysis Response:${NC}"
  echo $ANALYSIS_RESPONSE | python3 -m json.tool
else
  echo -e "${RED}✗ Lead analysis failed${NC}"
  echo "Response: $ANALYSIS_RESPONSE"
  exit 1
fi

echo -e "\n${GREEN}Test completed successfully!${NC}"