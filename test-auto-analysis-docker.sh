#!/bin/bash

# Test automatic lead analysis on event creation with Docker setup

API_URL="http://localhost:9033/api"

# First, let's login to get a token
echo "Logging in to get auth token..."
LOGIN_RESPONSE=$(curl -s -X POST "$API_URL/auth/login" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "123456"
  }')

TOKEN=$(echo $LOGIN_RESPONSE | jq -r '.data.access_token')

if [ "$TOKEN" == "null" ] || [ -z "$TOKEN" ]; then
  echo "Failed to get auth token. Response:"
  echo $LOGIN_RESPONSE | jq .
  exit 1
fi

echo "Got token: ${TOKEN:0:20}..."
echo ""

# Get a lead to test with
echo "Getting first lead..."
LEADS_RESPONSE=$(curl -s -X GET "$API_URL/leads" \
  -H "Authorization: Bearer $TOKEN")

LEAD_ID=$(echo $LEADS_RESPONSE | jq -r '.data.leads[0].id')

if [ "$LEAD_ID" == "null" ] || [ -z "$LEAD_ID" ]; then
  echo "No leads found. Creating a test lead..."
  CREATE_LEAD_RESPONSE=$(curl -s -X POST "$API_URL/leads" \
    -H "Authorization: Bearer $TOKEN" \
    -H "Content-Type: application/json" \
    -d '{
      "name": "Test Lead para Análise",
      "email": "testlead@example.com",
      "phone": "11999999999",
      "status": "novo"
    }')
  
  LEAD_ID=$(echo $CREATE_LEAD_RESPONSE | jq -r '.data.lead.id')
  echo "Created lead: $LEAD_ID"
else
  echo "Using existing lead: $LEAD_ID"
fi

echo ""

# Check current lead status
echo "Current lead analysis status:"
curl -s -X GET "$API_URL/leads/$LEAD_ID" \
  -H "Authorization: Bearer $TOKEN" | jq '.data.lead | {name, sentiment_status, lead_score, last_sentiment_update}'

echo ""
echo "Creating abandoned cart event..."

# Create an abandoned cart event
EVENT_RESPONSE=$(curl -s -X POST "$API_URL/leads/$LEAD_ID/events" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "event_type": "carrinho_abandonado",
    "event_data": {
      "products": ["Produto Premium A", "Produto Premium B"],
      "total_value": 1299.90,
      "cart_id": "cart-123456",
      "timestamp": "'$(date -u +"%Y-%m-%dT%H:%M:%S.000Z")'"
    },
    "origin": "website"
  }')

echo "Event creation response:"
echo $EVENT_RESPONSE | jq .

echo ""
echo "Waiting 5 seconds for AI analysis to complete..."
sleep 5

# Check the lead again to see if it was analyzed
echo ""
echo "Lead analysis after event creation:"
FINAL_LEAD=$(curl -s -X GET "$API_URL/leads/$LEAD_ID" \
  -H "Authorization: Bearer $TOKEN")

echo $FINAL_LEAD | jq '.data.lead | {name, sentiment_status, lead_score, last_sentiment_update, ai_analysis}'

# Check if analysis was updated
SENTIMENT_STATUS=$(echo $FINAL_LEAD | jq -r '.data.lead.sentiment_status')
LEAD_SCORE=$(echo $FINAL_LEAD | jq -r '.data.lead.lead_score')

echo ""
if [ "$SENTIMENT_STATUS" != "null" ] && [ "$LEAD_SCORE" != "null" ]; then
  echo "✅ SUCCESS: Lead was automatically analyzed!"
  echo "   Sentiment: $SENTIMENT_STATUS"
  echo "   Score: $LEAD_SCORE"
else
  echo "❌ FAILED: Lead was not analyzed automatically"
  echo "   Check backend logs for errors"
fi

echo ""
echo "To check backend logs, run:"
echo "docker compose logs backend --tail 50 | grep -E '(Lead.*analyzed|Error analyzing|AI service)'"