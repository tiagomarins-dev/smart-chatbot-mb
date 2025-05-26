# Automatic Lead Analysis on Event Creation

## Overview

The system now automatically analyzes leads using AI whenever a new event is registered for them. This ensures that lead sentiment and scoring are always up-to-date based on their latest activities.

## Implementation Details

### Modified Files
- `/backend/src/controllers/leadEventsController.ts` - Added automatic analysis trigger in `createLeadEventController`

### How It Works

1. When a new event is created via `POST /api/leads/:id/events`, the system:
   - Creates the event as usual
   - Fetches the lead's complete data including:
     - Lead information (name, email, phone, etc.)
     - Recent WhatsApp conversations (last 20 messages)
     - All lead events
     - Associated projects
   - Sends this data to the AI service for analysis
   - Updates the lead record with:
     - `sentiment_status` - The AI-determined sentiment
     - `lead_score` - Score from 0-100
     - `ai_analysis` - Detailed analysis text
     - `last_sentiment_update` - Timestamp of analysis

2. The analysis runs asynchronously and doesn't block the event creation
3. If the AI analysis fails, the event is still created successfully
4. All analysis activity is logged to the console

### Example Event That Triggers Analysis

```json
{
  "event_type": "carrinho_abandonado",
  "event_data": {
    "products": ["Produto A", "Produto B"],
    "total_value": 299.90
  },
  "origin": "website"
}
```

### AI Analysis Rules

The AI service uses specific rules for e-commerce events:
- `carrinho_abandonado` (abandoned cart) - Minimum score: 75 (high purchase intent)
- `clicou_link_compra` or `clicou_link_pagamento` - Minimum score: 70
- Multiple recent interactions - Higher scores
- No recent activity - Lower scores

### Testing

Use the provided test script:
```bash
./test-automatic-analysis.sh
```

Make sure to update the script with:
- Your authentication token
- A valid lead ID

The script will:
1. Create a new event for the lead
2. Wait for the analysis to complete
3. Show the updated lead with AI analysis results

### Monitoring

Check the backend logs for analysis activity:
```bash
# Success logs
"Lead {id} analyzed automatically after event creation"

# Error logs
"Failed to analyze lead {id}: AI service responded with {status}"
"Error analyzing lead after event creation: {error}"
```

### Configuration

Ensure these environment variables are set:
- `AI_SERVICE_URL` - Default: `http://ai-service:8050`
- `AI_SERVICE_KEY` - API key for AI service authentication
- `OPENAI_API_KEY` - Required in the AI service for OpenAI integration