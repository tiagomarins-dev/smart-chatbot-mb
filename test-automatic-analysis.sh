#!/bin/bash

# Test automatic lead analysis on event creation

API_URL="http://localhost:9033/api"
TOKEN="YOUR_TOKEN_HERE"  # Replace with actual token

# Lead ID to test (replace with actual lead ID)
LEAD_ID="YOUR_LEAD_ID"

echo "Testing automatic lead analysis when creating an event..."
echo ""

# Create a new event for the lead
echo "Creating new event for lead $LEAD_ID..."
curl -X POST "$API_URL/leads/$LEAD_ID/events" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "event_type": "carrinho_abandonado",
    "event_data": {
      "products": ["Produto A", "Produto B"],
      "total_value": 299.90,
      "timestamp": "'$(date -u +"%Y-%m-%dT%H:%M:%S.000Z")'"
    },
    "origin": "website"
  }' | jq .

echo ""
echo "Event created. The lead analysis should have been triggered automatically."
echo ""

# Wait a bit for the analysis to complete
sleep 3

# Check the lead to see if it was analyzed
echo "Checking lead analysis results..."
curl -X GET "$API_URL/leads/$LEAD_ID" \
  -H "Authorization: Bearer $TOKEN" | jq '.data.lead | {name, sentiment_status, lead_score, last_sentiment_update, ai_analysis}'

echo ""
echo "Test complete!"