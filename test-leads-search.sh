#!/bin/bash

# Load the API Key from .env file if it exists
if [ -f .env ]; then
  source .env
fi

# Set default API Key and URL if not provided in .env
API_KEY=${API_KEY:-"your-api-key-here"}
API_URL=${API_URL:-"http://localhost:3000/api"}

# Test the UTM counts endpoint
echo "Testing UTM Counts API..."
curl -s "${API_URL}/leads/utm-counts?api_key=${API_KEY}" | jq .

echo -e "\n\n"

# Test the search leads endpoint with no filters
echo "Testing Search Leads API (no filters)..."
curl -s "${API_URL}/leads/search?api_key=${API_KEY}&limit=5" | jq .

echo -e "\n\n"

# Test the search leads endpoint with text search
echo "Testing Search Leads API (with text search)..."
curl -s "${API_URL}/leads/search?api_key=${API_KEY}&search=test&limit=5" | jq .

echo -e "\n\n"

# Test the search leads endpoint with UTM filtering
echo "Testing Search Leads API (with UTM filtering)..."
curl -s "${API_URL}/leads/search?api_key=${API_KEY}&utm_source=google&limit=5" | jq .