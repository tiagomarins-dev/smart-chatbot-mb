/**
 * Test script for the WhatsApp chatbot functionality
 * This script simulates incoming messages to test the chatbot's responses
 */

const axios = require('axios');

// Configuration
const API_URL = 'http://localhost:8080/api'; // Default backend URL
const WEBHOOK_ENDPOINT = `${API_URL}/whatsapp/webhook`;

// Test lead data - replace with actual data from your database
const LEAD_PHONE = '5521987654321';
const LEAD_ID = 'xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx'; // Replace with actual lead ID

// Test messages to simulate
const TEST_MESSAGES = [
  // Project price questions
  { message: 'Qual é o preço do projeto?', description: 'Generic price question' },
  { message: 'Quanto custa o apartamento?', description: 'Apartment price question' },
  { message: 'Gostaria de saber o valor do projeto Villa Garden', description: 'Specific project price question' },
  
  // Delivery date questions
  { message: 'Quando o projeto será entregue?', description: 'Generic delivery question' },
  { message: 'Qual a previsão de entrega?', description: 'Alternative delivery question' },
  
  // Location questions
  { message: 'Onde fica localizado o empreendimento?', description: 'Location question' },
  { message: 'Qual o endereço do projeto?', description: 'Address question' },
  
  // Size and bedrooms questions
  { message: 'Qual a metragem do apartamento?', description: 'Size question' },
  { message: 'Quantos quartos tem o imóvel?', description: 'Bedrooms question' },
  
  // General information questions
  { message: 'Gostaria de mais informações sobre o projeto', description: 'General info question' },
  
  // Non-project questions (should not trigger a chatbot response)
  { message: 'Bom dia, tudo bem?', description: 'Greeting (should not trigger response)' },
  { message: 'Você pode me ajudar?', description: 'Generic help (should not trigger response)' }
];

// Function to simulate a webhook call with an incoming message
async function simulateIncomingMessage(message, leadId, phoneNumber) {
  console.log(`\n----- Testing: "${message}" -----`);
  
  try {
    // Create webhook payload for incoming message
    const webhookData = {
      type: 'message',
      data: {
        id: `test-msg-${Date.now()}`,
        from: phoneNumber,
        to: '5521999999999', // Company WhatsApp number
        fromMe: false,
        body: message,
        timestamp: new Date().toISOString(),
        lead_id: leadId
      },
      timestamp: Date.now()
    };
    
    // Send webhook request
    console.log(`Sending webhook request to ${WEBHOOK_ENDPOINT}...`);
    
    const response = await axios.post(WEBHOOK_ENDPOINT, webhookData, {
      headers: { 'Content-Type': 'application/json' }
    });
    
    console.log('Webhook response:', response.status, response.data);
    console.log('Message sent successfully. Check the logs for chatbot processing output.');
    
    // Allow some time for processing
    return new Promise(resolve => setTimeout(resolve, 2000));
  }
  catch (error) {
    console.error('Error sending test message:', error.message);
    if (error.response) {
      console.error('Response data:', error.response.data);
      console.error('Response status:', error.response.status);
    }
  }
}

// Run all test messages in sequence
async function runAllTests() {
  console.log('Starting WhatsApp chatbot tests...');
  console.log(`Using lead ID: ${LEAD_ID}`);
  console.log(`Using phone number: ${LEAD_PHONE}`);
  
  for (const test of TEST_MESSAGES) {
    console.log(`\n========== Testing: ${test.description} ==========`);
    await simulateIncomingMessage(test.message, LEAD_ID, LEAD_PHONE);
    // Add pause between tests
    await new Promise(resolve => setTimeout(resolve, 3000));
  }
  
  console.log('\n========== All tests completed ==========');
}

// Execute the tests
runAllTests().catch(err => {
  console.error('Error running tests:', err);
  process.exit(1);
});