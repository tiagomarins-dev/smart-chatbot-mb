// Simple script to test authentication API
const fetch = require('node-fetch');

const API_URL = 'http://localhost:9033/api';

async function testLogin() {
  console.log('Testing login with default credentials...');
  
  try {
    // Try common test credentials
    const testCredentials = [
      { email: 'admin@example.com', password: 'admin' },
      { email: 'test@example.com', password: 'test' },
      { email: 'user@example.com', password: 'user' },
      { email: 'admin@example.com', password: 'password' },
      { email: 'demo@example.com', password: 'demo' }
    ];
    
    for (const creds of testCredentials) {
      console.log(`Trying: ${creds.email} / ${creds.password}`);
      
      const response = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(creds)
      });
      
      const data = await response.json();
      console.log(`Response for ${creds.email}:`, data);
      
      if (data.success) {
        console.log('Login successful!');
        return data;
      }
    }
    
    console.log('All login attempts failed');
    return null;
  } catch (error) {
    console.error('Error during login test:', error);
    return null;
  }
}

async function testRegistration() {
  console.log('\nTesting user registration...');
  
  try {
    const newUser = {
      email: `testuser${Math.floor(Math.random() * 10000)}@example.com`,
      password: 'Password123!',
      name: 'Test User'
    };
    
    console.log(`Registering user: ${newUser.email}`);
    
    const response = await fetch(`${API_URL}/auth/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(newUser)
    });
    
    const data = await response.json();
    console.log('Registration response:', data);
    
    if (data.success) {
      console.log('Registration successful!');
      return newUser;
    } else {
      console.log('Registration failed');
      return null;
    }
  } catch (error) {
    console.error('Error during registration test:', error);
    return null;
  }
}

async function main() {
  // Test login first
  const loginResult = await testLogin();
  
  // If login fails, try registration
  if (!loginResult) {
    const registeredUser = await testRegistration();
    
    // If registration succeeds, try logging in with new user
    if (registeredUser) {
      console.log('\nTrying to login with newly registered user...');
      
      try {
        const loginResponse = await fetch(`${API_URL}/auth/login`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            email: registeredUser.email,
            password: registeredUser.password
          })
        });
        
        const loginData = await loginResponse.json();
        console.log('Login response with new user:', loginData);
        
        if (loginData.success) {
          console.log('Login with new user successful!');
        } else {
          console.log('Login with new user failed');
        }
      } catch (error) {
        console.error('Error during new user login test:', error);
      }
    }
  }
}

main();