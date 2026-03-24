// Quick API Health Check - Save as: test-api.mjs
// Run with: node test-api.mjs

import axios from 'axios';

const API_URL = 'http://localhost:5000/api';

const tests = [
  {
    name: 'Health Check',
    method: 'GET',
    url: 'http://localhost:5000',
    data: null,
  },
  {
    name: 'Signup',
    method: 'POST',
    url: `${API_URL}/auth/signup`,
    data: {
      name: 'Test User',
      email: `test_${Date.now()}@example.com`,
      password: 'password123',
      role: 'buyer',
    },
  },
];

async function runTests() {
  console.log('🧪 Starting API Tests...\n');

  for (const test of tests) {
    try {
      console.log(`📍 Testing: ${test.name}`);
      const response = await axios({
        method: test.method,
        url: test.url,
        data: test.data,
        timeout: 5000,
      });

      console.log(`✅ ${test.name} - Success`);
      console.log(`   Status: ${response.status}`);
      if (response.data.token) {
        console.log(`   Token: ${response.data.token.substring(0, 20)}...`);
      }
      console.log('');
    } catch (error) {
      console.log(`❌ ${test.name} - Failed`);
      if (error.code === 'ECONNREFUSED') {
        console.log('   Error: Cannot connect to backend');
        console.log('   Make sure: Backend is running on http://localhost:5000');
      } else if (error.response) {
        console.log(`   Status: ${error.response.status}`);
        console.log(`   Message: ${error.response.data?.msg || error.message}`);
      } else {
        console.log(`   Error: ${error.message}`);
      }
      console.log('');
    }
  }

  console.log('✨ Tests complete!\n');
}

runTests();
