// Test for Backend API Authentication with newly created user
const fetch = require('node-fetch');
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

// Get Supabase credentials from environment
const SUPABASE_URL = process.env.SUPABASE_URL || 'http://localhost:54321';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_KEY;
const API_URL = process.env.API_URL || 'http://localhost:9033/api';

console.log('SUPABASE_SERVICE_KEY:', SUPABASE_SERVICE_KEY);

console.log('Supabase URL:', SUPABASE_URL);
console.log('API URL:', API_URL);

// Create Supabase client
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

async function createTestUser() {
  console.log('\n🔄 Creating a test user for API authentication testing...');
  
  // Test credentials
  const testEmail = `apitest${Math.floor(Math.random() * 10000)}@example.com`;
  const testPassword = 'ApiTest123!';
  const testName = 'API Test User';
  
  console.log(`👤 Creating user: ${testEmail}`);
  
  try {
    // Create a new user with Supabase Auth
    const { data, error } = await supabase.auth.admin.createUser({
      email: testEmail,
      password: testPassword,
      email_confirm: true,
      user_metadata: {
        name: testName
      }
    });
    
    if (error) {
      console.error('❌ User creation failed:', error.message);
      return null;
    }
    
    console.log('✅ User created successfully!');
    
    return {
      email: testEmail,
      password: testPassword,
      name: testName,
      id: data.user.id
    };
  } catch (error) {
    console.error('❌ User creation failed with exception:', error.message);
    return null;
  }
}

async function testBackendLogin(credentials) {
  console.log('\n🔄 Testing backend API login...');
  
  try {
    console.log(`👤 Logging in with: ${credentials.email}`);
    
    // Try to login with the API
    const response = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        email: credentials.email,
        password: credentials.password
      })
    });
    
    const data = await response.json();
    
    console.log('🔍 API Response Status:', response.status);
    console.log('🔍 API Response Body:', JSON.stringify(data, null, 2));
    
    if (data.success) {
      console.log('✅ API Login successful!');
      
      // Test token verification
      console.log('\n🔄 Testing token verification...');
      
      const verifyResponse = await fetch(`${API_URL}/auth/verify`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          token: data.data.token
        })
      });
      
      const verifyData = await verifyResponse.json();
      
      console.log('🔍 Verify Response Status:', verifyResponse.status);
      console.log('🔍 Verify Response Body:', JSON.stringify(verifyData, null, 2));
      
      if (verifyData.success) {
        console.log('✅ Token verification successful!');
      } else {
        console.log('❌ Token verification failed!');
      }
      
      // Test authenticated endpoint
      console.log('\n🔄 Testing authenticated endpoint...');
      
      const authResponse = await fetch(`${API_URL}/auth/user`, {
        headers: {
          'Authorization': `Bearer ${data.data.token}`
        }
      });
      
      const authData = await authResponse.json();
      
      console.log('🔍 Auth Endpoint Response Status:', authResponse.status);
      console.log('🔍 Auth Endpoint Response Body:', JSON.stringify(authData, null, 2));
      
      if (authData.success) {
        console.log('✅ Authenticated request successful!');
      } else {
        console.log('❌ Authenticated request failed!');
      }
    } else {
      console.log('❌ API Login failed!');
    }
  } catch (error) {
    console.error('❌ API test failed with exception:', error.message);
  }
}

async function main() {
  // Create a test user
  const testUser = await createTestUser();
  
  if (testUser) {
    // Test backend login with the created user
    await testBackendLogin(testUser);
  }
  
  console.log('\n🏁 Test completed!');
}

main();