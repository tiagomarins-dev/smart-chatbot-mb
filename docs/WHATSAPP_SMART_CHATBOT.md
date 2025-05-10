# WhatsApp Smart Chatbot Implementation

## Overview

This document describes the implementation of a smart chatbot for WhatsApp that can automatically answer common questions about projects. The chatbot integrates with the existing WhatsApp messaging infrastructure and can provide instant responses to leads' questions about project details such as pricing, delivery dates, location, and features.

## Architecture

The Smart Chatbot system consists of the following components:

1. **ChatbotService**: Core service that analyzes incoming messages and generates responses
2. **Message Processing**: Integration with the existing WhatsApp webhook handler
3. **Project Data Retrieval**: Functions to retrieve project information from the database
4. **Response Generation**: Templates and logic for generating natural language responses

## How It Works

1. **Message Reception**:
   - Customer sends a message via WhatsApp
   - The message is received through the webhook
   - Message is saved in the database (lead_events and whatsapp_conversations tables)

2. **Message Analysis**:
   - The chatbot service analyzes the message content
   - It determines if the message is a question about a project
   - It extracts the question category and any mentioned project details

3. **Response Generation**:
   - If the message is recognized as a project-related question, the chatbot retrieves project data
   - It generates an appropriate response based on the question category
   - The system checks if an automatic response should be sent

4. **Response Sending**:
   - Automatic responses are sent back to the customer via WhatsApp API
   - Responses are tracked in the database with an "automated" flag
   - Response times are calculated for analytics purposes

## Supported Question Categories

The chatbot can currently identify and respond to the following question categories:

1. **Price Questions**:
   - "Quanto custa o projeto X?"
   - "Qual o valor do apartamento?"
   - "Preço do imóvel"

2. **Delivery Date Questions**:
   - "Quando o projeto será entregue?"
   - "Previsão de entrega do empreendimento"
   - "Data de conclusão"

3. **Location Questions**:
   - "Onde fica o projeto?"
   - "Endereço do empreendimento"
   - "Localização do imóvel"

4. **Size and Layout Questions**:
   - "Qual a metragem do apartamento?"
   - "Quantos quartos tem?"
   - "Tem quantas vagas de garagem?"

5. **General Information Requests**:
   - "Preciso de mais informações sobre o projeto X"
   - "Me fale mais sobre o empreendimento"
   - "Detalhes do projeto"

## Project-Specific Responses

The chatbot can generate responses about specific projects in two ways:

1. **Explicit Project Reference**:
   - When a lead mentions a specific project by name in their question
   - Example: "Qual o preço do projeto Villa Garden?"

2. **Lead's Associated Projects**:
   - When a lead is already associated with one or more projects in the database
   - For leads with a single project, the chatbot assumes questions refer to that project
   - For leads with multiple projects, the chatbot asks for clarification

## Implementation Details

### Core Files

1. **`/backend/src/services/chatbot/chatbotService.ts`**:
   - Main service implementation
   - Contains message analysis and response generation logic

2. **`/backend/src/controllers/whatsappController.ts`**:
   - Updated to integrate chatbot processing in the webhook handler
   - Implements automatic response sending

3. **`/backend/src/services/whatsappConversationsService.ts`**:
   - Handles saving conversation data and analytics

### Database Schema Updates

No additional database schema changes were required. The chatbot uses existing tables:

- `whatsapp_conversations`: Stores message content and analysis results
- `lead_events`: Records message events (for compatibility)
- `projects`: Retrieves project data for responses
- `lead_project`: Maps leads to their associated projects

### Testing

A test script is provided at `/test-chatbot.js` that simulates incoming messages to test the chatbot functionality.

## Configuration Options

The chatbot behavior can be adjusted by modifying the following parameters in the `chatbotService.ts` file:

1. **Response Templates**: Adjust the wording and structure of automated responses
2. **Question Keywords**: Update the keywords used to identify different question categories
3. **Project Matching**: Configure how the system matches project names in messages

## Future Enhancements

Potential future enhancements for the chatbot include:

1. **Advanced NLU**: Implement more sophisticated natural language understanding using AI APIs
2. **Conversation Context**: Maintain context across multiple messages to handle follow-up questions
3. **Lead Qualification**: Use chatbot interactions to score and qualify leads automatically
4. **Analytics Dashboard**: Create a dashboard to track chatbot performance metrics
5. **Multi-language Support**: Add support for responding in different languages
6. **Response Customization**: Allow customizing response templates per project or company

## Metrics and Analytics

The chatbot implementation includes tracking of several metrics:

1. **Response Rate**: Percentage of messages that receive automated responses
2. **Question Categories**: Distribution of question types received
3. **Response Time**: Time saved by automated responses vs. manual responses
4. **User Satisfaction**: Tracking if leads ask follow-up questions or thank the bot

## Conclusion

The WhatsApp Smart Chatbot provides an efficient way to offer immediate responses to common project inquiries, improving lead engagement and reducing response times. The system integrates smoothly with the existing WhatsApp infrastructure and provides valuable data for lead qualification and sales team optimization.