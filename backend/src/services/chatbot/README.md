# WhatsApp Smart Chatbot

A smart chatbot implementation for WhatsApp that can automatically answer common questions about projects.

## Features

- Automatically answers common questions about projects
- Detects question intent and categorizes by type
- Retrieves project data from the database
- Generates natural language responses
- Integrates with existing WhatsApp messaging system

## Files

- `chatbotService.ts` - Core implementation of the chatbot
- `chatbotConfig.ts` - Configuration options for customizing behavior
- `index.ts` - Export module for easy importing

## How to Customize

The chatbot behavior can be easily customized by modifying the `chatbotConfig.ts` file:

1. **Question Detection**: Adjust question phrases and project-related keywords
2. **Response Templates**: Customize response wording and structure
3. **Categories**: Add or modify question categories and their detection keywords

## Usage

The chatbot is automatically integrated into the WhatsApp webhook handler:

```typescript
import { chatbotService } from '../services/chatbot';

// Process an incoming message
const chatbotResult = await chatbotService.processMessage(message, leadId);

// Check if we should respond automatically
if (chatbotResult.shouldRespond && chatbotResult.message) {
  // Send automatic response
  await sendResponse(phoneNumber, chatbotResult.message, leadId);
}
```

## Testing

Use the `test-chatbot.js` script in the project root to test the chatbot functionality:

```bash
node test-chatbot.js
```

This will simulate various types of incoming messages to test response generation.

## Documentation

For more detailed information about the implementation, see the full documentation in:
`/docs/WHATSAPP_SMART_CHATBOT.md`