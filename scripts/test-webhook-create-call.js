/**
 * Test script that creates a call end-to-end
 * Uses the same conversation_id for both events
 */

const https = require('https');

const APP_URL = 'https://www.intakegenie.xyz';
const FIRM_ID = '591329c4-0dc9-4164-955e-79a273e550d0';
const CONVERSATION_ID = `test-call-${Date.now()}`;

function makeRequest(url, data) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const postData = JSON.stringify(data);

    const options = {
      hostname: urlObj.hostname,
      port: 443,
      path: urlObj.pathname,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData),
      },
    };

    const req = https.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => {
        body += chunk;
      });
      res.on('end', () => {
        try {
          const parsed = JSON.parse(body);
          resolve({ status: res.statusCode, data: parsed });
        } catch (e) {
          resolve({ status: res.statusCode, data: body });
        }
      });
    });

    req.on('error', reject);
    req.write(postData);
    req.end();
  });
}

async function test() {
  console.log('🧪 Testing webhook call creation...\n');
  console.log(`Conversation ID: ${CONVERSATION_ID}`);
  console.log(`Firm ID: ${FIRM_ID}\n`);

  // Step 1: conversation.updated - creates the call
  console.log('📞 Step 1: Sending conversation.updated event...');
  const updateResponse = await makeRequest(`${APP_URL}/api/vapi/webhook`, {
    event: 'conversation.updated',
    conversation_id: CONVERSATION_ID,
    metadata: {
      firmId: FIRM_ID,
    },
    phoneNumber: '+16592157925',
    phoneNumberId: 'test-phone-id',
    structuredData: {
      full_name: 'Test User',
      callback_number: '+1234567890',
      reason_for_call: 'Integration test call',
    },
    transcript: 'Test conversation transcript',
  });

  console.log(`   Status: ${updateResponse.status}`);
  console.log(`   Response: ${JSON.stringify(updateResponse.data)}\n`);

  if (updateResponse.status !== 200) {
    console.error('❌ conversation.updated failed!');
    return;
  }

  // Wait a bit for the call to be created
  console.log('⏳ Waiting 2 seconds for call to be created...\n');
  await new Promise(resolve => setTimeout(resolve, 2000));

  // Step 2: conversation.completed - finalizes the call
  console.log('✅ Step 2: Sending conversation.completed event...');
  const completedResponse = await makeRequest(`${APP_URL}/api/vapi/webhook`, {
    event: 'conversation.completed',
    conversation_id: CONVERSATION_ID,
    metadata: {
      firmId: FIRM_ID,
    },
    phoneNumber: '+16592157925',
    transcript: 'Full test conversation transcript. This is a comprehensive test of the Vapi webhook integration to verify that calls are properly logged in the system.',
  });

  console.log(`   Status: ${completedResponse.status}`);
  console.log(`   Response: ${JSON.stringify(completedResponse.data)}\n`);

  if (completedResponse.status !== 200) {
    console.error('❌ conversation.completed failed!');
    return;
  }

  console.log('✅ Test completed!');
  console.log('\n📋 Next steps:');
  console.log('1. Check your Vercel logs for:');
  console.log('   - [Vapi Webhook] Resolved firmId:', FIRM_ID);
  console.log('   - [Upsert Call] Call created successfully');
  console.log('   - [Finalize Call] Call finalized successfully');
  console.log(`2. Check your Calls section for conversation_id: ${CONVERSATION_ID}`);
  console.log('3. If call doesn\'t appear, check logs for errors');
}

test().catch(console.error);

