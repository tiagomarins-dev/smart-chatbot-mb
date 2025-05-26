#!/bin/bash

# Create a test user for testing purposes

echo "Creating test user via Supabase..."

# Using Supabase API to create user
curl -X POST 'https://gciezqjeaehrtihqjihz.supabase.co/auth/v1/signup' \
  -H "apikey: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdjaWV6cWplYWVocnRpaHFqaWh6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDYzNTMxOTgsImV4cCI6MjA2MTkyOTE5OH0.YjnAinUQaOMZVgxbJsyJR6xIByjnnLiJIJYEgvOvcrM" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "123456"
  }' | jq .