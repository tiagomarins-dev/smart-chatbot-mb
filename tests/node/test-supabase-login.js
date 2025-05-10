// Test for Supabase connection and login
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

// Get Supabase credentials from environment
const SUPABASE_URL = process.env.SUPABASE_URL || 'http://localhost:54321';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_ANON_KEY;

if (!SUPABASE_SERVICE_KEY) {
  console.error('ERROR: SUPABASE_SERVICE_KEY not found in environment');
  process.exit(1);
}

// Display credentials for debugging (mask part of the key)
console.log('Supabase URL:', SUPABASE_URL);
console.log('Supabase Key:', SUPABASE_SERVICE_KEY.substring(0, 5) + '...' + 
  (SUPABASE_SERVICE_KEY.length > 10 ? SUPABASE_SERVICE_KEY.substring(SUPABASE_SERVICE_KEY.length - 5) : ''));

// Create Supabase client
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

async function testConnection() {
  console.log('\n🔄 Testing Supabase connection...');

  try {
    // Simple query to check connection
    const { data, error } = await supabase.from('profiles').select('*');

    if (error) {
      console.error('❌ Connection failed:', error.message);
      return false;
    }

    console.log('✅ Connection successful!');
    console.log('📊 Profiles count:', data.length);
    return true;
  } catch (error) {
    console.error('❌ Connection failed with exception:', error.message);
    return false;
  }
}

async function testAuth() {
  console.log('\n🔄 Testing Auth functionality...');
  
  // Test credentials
  const testEmail = `test${Math.floor(Math.random() * 10000)}@example.com`;
  const testPassword = 'Test123!@#';
  const testName = 'Test User';
  
  console.log(`👤 Creating test user: ${testEmail}`);
  
  try {
    // Try to create a new user
    const { data: createData, error: createError } = await supabase.auth.admin.createUser({
      email: testEmail,
      password: testPassword,
      email_confirm: true,
      user_metadata: {
        name: testName
      }
    });
    
    if (createError) {
      console.error('❌ User creation failed:', createError.message);
    } else {
      console.log('✅ User created successfully!');
      console.log('📝 User details:', {
        id: createData.user.id,
        email: createData.user.email,
        confirmed: createData.user.email_confirmed_at ? 'Yes' : 'No'
      });
      
      // Check if profile was created by the trigger
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', createData.user.id)
        .single();
      
      if (profileError) {
        console.error('❌ Profile retrieval failed:', profileError.message);
      } else if (profileData) {
        console.log('✅ Profile created automatically!');
        console.log('📝 Profile details:', profileData);
      } else {
        console.log('❌ Profile not created for the user');
      }
      
      // Try to sign in with the created user
      console.log('\n🔄 Testing login with created user...');
      
      const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
        email: testEmail,
        password: testPassword
      });
      
      if (signInError) {
        console.error('❌ Sign in failed:', signInError.message);
      } else {
        console.log('✅ Sign in successful!');
        console.log('🔑 Session established for user:', signInData.user.email);
        
        // Get a list of all users (requires service role key)
        console.log('\n📋 Listing all users (first 5):');
        
        const { data: usersData, error: usersError } = await supabase.auth.admin.listUsers();
        
        if (usersError) {
          console.error('❌ User listing failed:', usersError.message);
        } else {
          const users = usersData.users.slice(0, 5).map(u => ({
            id: u.id,
            email: u.email,
            created_at: u.created_at
          }));
          
          console.table(users);
          console.log(`Total users: ${usersData.users.length}`);
        }
      }
    }
  } catch (error) {
    console.error('❌ Auth test failed with exception:', error.message);
  }
}

async function main() {
  const connected = await testConnection();
  
  if (connected) {
    await testAuth();
  }
  
  console.log('\n🏁 Test completed!');
}

main();