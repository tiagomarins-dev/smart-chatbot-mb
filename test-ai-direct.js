// Test direct connection to AI service
const fetch = require('node-fetch');

async function testAIService() {
  console.log('Testing AI Service...');
  console.log('AI_SERVICE_URL:', process.env.AI_SERVICE_URL || 'not set');
  console.log('AI_SERVICE_KEY:', process.env.AI_SERVICE_KEY || 'not set');
  
  const url = `${process.env.AI_SERVICE_URL || 'http://localhost:9035'}/v1/analyze-lead`;
  const body = {
    lead_id: "test-123",
    lead_name: "Teste Lead",
    lead_email: "teste@example.com",
    conversations: [{content: "Olá, quanto custa?", direction: "incoming"}],
    events: []
  };
  
  try {
    console.log('Calling:', url);
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.AI_SERVICE_KEY || 'internal-api-key-2024'}`
      },
      body: JSON.stringify(body)
    });
    
    console.log('Response status:', response.status);
    const data = await response.json();
    console.log('Response data:', JSON.stringify(data, null, 2));
  } catch (error) {
    console.error('Error:', error.message);
  }
}

// Load env vars
require('dotenv').config();
testAIService();