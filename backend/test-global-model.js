/**
 * Test script to verify the global model AI system
 * Tests:
 * 1. Global model training on first request
 * 2. Chat endpoint using global model
 * 3. Suggestions endpoint using global model with personalization
 * 4. Multiple users getting recommendations from same global model
 */

const axios = require('axios');
const jwt = require('jsonwebtoken');

const API_URL = 'http://localhost:5000';
const ML_SERVICE_URL = 'http://localhost:5001';
const JWT_SECRET = 'your_super_secret_jwt_key_change_this_in_production';

// Generate valid JWT tokens for test users
function generateToken(userId) {
  return jwt.sign(
    { userId, email: `${userId}@test.com` },
    JWT_SECRET,
    { expiresIn: '7d' }
  );
}

// Test users
const testUsers = [
  { id: 'user-1', token: generateToken('user-1') },
  { id: 'user-2', token: generateToken('user-2') },
  { id: 'user-3', token: generateToken('user-3') },
];

// Helper to make API calls
async function apiCall(method, endpoint, data = null, token = null) {
  try {
    // Use a default valid token if none provided
    const finalToken = token || generateToken('test-user');
    
    const config = {
      method,
      url: `${API_URL}${endpoint}`,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${finalToken}`,
      },
    };

    if (data) {
      config.data = data;
    }

    const response = await axios(config);
    return { success: true, data: response.data, status: response.status };
  } catch (error) {
    return {
      success: false,
      error: error.response?.data || error.message,
      status: error.response?.status,
    };
  }
}

// Helper to check ML service
async function checkMLService() {
  try {
    const response = await axios.get(`${ML_SERVICE_URL}/health`);
    return { success: true, status: response.status };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

// Test 1: Check ML Service is running
async function testMLServiceHealth() {
  console.log('\n=== TEST 1: ML Service Health ===');
  const result = await checkMLService();
  if (result.success) {
    console.log('✅ ML Service is running');
    return true;
  } else {
    console.log('❌ ML Service is NOT running:', result.error);
    return false;
  }
}

// Test 2: Check global model training
async function testGlobalModelTraining() {
  console.log('\n=== TEST 2: Global Model Training ===');
  
  // Check if global model exists
  try {
    const response = await axios.get(`${ML_SERVICE_URL}/api/ml/model/global-model`);
    console.log('✅ Global model exists:', response.data);
    return true;
  } catch (error) {
    console.log('⚠️  Global model not yet trained (this is OK on first run)');
    return false;
  }
}

// Test 3: Chat endpoint with global model
async function testChatEndpoint() {
  console.log('\n=== TEST 3: Chat Endpoint (Global Model) ===');
  
  const chatData = {
    messages: [
      { role: 'user', content: 'I am feeling stressed and anxious today' },
    ],
  };

  const token = generateToken('test-user');
  const result = await apiCall('POST', '/api/ai/chat', chatData, token);
  
  if (result.success) {
    console.log('✅ Chat endpoint working');
    console.log('   Response:', result.data.reply);
    console.log('   Source:', result.data.source);
    console.log('   Model Type:', result.data.modelType);
    return true;
  } else {
    console.log('❌ Chat endpoint failed:', result.error);
    return false;
  }
}

// Test 4: Suggestions endpoint with global model
async function testSuggestionsEndpoint() {
  console.log('\n=== TEST 4: Suggestions Endpoint (Global Model + Personalization) ===');
  
  const suggestionsData = {
    profile: { age: 25, gender: 'female' },
    phase: 'follicular',
    mood: 'stressed',
    anxietyLevel: 7,
  };

  const token = generateToken('test-user');
  const result = await apiCall('POST', '/api/ai/suggestions', suggestionsData, token);
  
  if (result.success) {
    console.log('✅ Suggestions endpoint working');
    console.log('   Source:', result.data.source);
    console.log('   Model Type:', result.data.modelType);
    console.log('   Personalized:', result.data.personalized);
    console.log('   Confidence:', result.data.confidence);
    console.log('   Meals:', result.data.meals);
    console.log('   Workout:', result.data.workout);
    console.log('   Wellness Tip:', result.data.wellnessTip);
    return true;
  } else {
    console.log('❌ Suggestions endpoint failed:', result.error);
    return false;
  }
}

// Test 5: Multiple users using same global model
async function testMultipleUsersGlobalModel() {
  console.log('\n=== TEST 5: Multiple Users Using Global Model ===');
  
  const suggestionsData = {
    profile: { age: 25, gender: 'female' },
    phase: 'follicular',
    mood: 'stressed',
    anxietyLevel: 7,
  };

  let allSuccess = true;
  const responses = [];

  for (const user of testUsers) {
    const result = await apiCall('POST', '/api/ai/suggestions', suggestionsData, user.token);
    
    if (result.success) {
      console.log(`✅ User ${user.id} got suggestions`);
      console.log(`   Model Type: ${result.data.modelType}`);
      console.log(`   Source: ${result.data.source}`);
      responses.push(result.data);
    } else {
      console.log(`❌ User ${user.id} failed:`, result.error);
      allSuccess = false;
    }
  }

  // Verify all users got recommendations from global model
  if (responses.length === testUsers.length) {
    const allGlobal = responses.every(r => r.modelType === 'global');
    if (allGlobal) {
      console.log('✅ All users are using the GLOBAL model');
      return true;
    } else {
      console.log('❌ Not all users are using the global model');
      return false;
    }
  }

  return allSuccess;
}

// Test 6: Verify global model ID in ML service
async function testGlobalModelInMLService() {
  console.log('\n=== TEST 6: Global Model in ML Service ===');
  
  try {
    const response = await axios.get(`${ML_SERVICE_URL}/api/ml/model/global-model`);
    console.log('✅ Global model found in ML service');
    console.log('   Status:', response.data);
    return true;
  } catch (error) {
    console.log('⚠️  Global model not found (may need training)');
    return false;
  }
}

// Run all tests
async function runAllTests() {
  console.log('╔════════════════════════════════════════════════════════════╗');
  console.log('║     GLOBAL MODEL AI SYSTEM - COMPREHENSIVE TEST SUITE      ║');
  console.log('╚════════════════════════════════════════════════════════════╝');

  const results = [];

  results.push(await testMLServiceHealth());
  results.push(await testGlobalModelTraining());
  results.push(await testChatEndpoint());
  results.push(await testSuggestionsEndpoint());
  results.push(await testMultipleUsersGlobalModel());
  results.push(await testGlobalModelInMLService());

  console.log('\n╔════════════════════════════════════════════════════════════╗');
  console.log('║                      TEST SUMMARY                          ║');
  console.log('╚════════════════════════════════════════════════════════════╝');
  
  const passed = results.filter(r => r).length;
  const total = results.length;
  
  console.log(`\nTests Passed: ${passed}/${total}`);
  
  if (passed === total) {
    console.log('\n✅ ALL TESTS PASSED - Global Model System is Working!');
  } else {
    console.log(`\n⚠️  ${total - passed} test(s) failed - Review output above`);
  }
}

// Run tests
runAllTests().catch(console.error);
