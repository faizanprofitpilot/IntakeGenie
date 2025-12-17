#!/usr/bin/env node

/**
 * Test script for the email endpoint
 * Usage: node scripts/test-email.js <your-email@example.com>
 */

const email = process.argv[2];

if (!email) {
  console.error('❌ Error: Please provide an email address');
  console.log('Usage: node scripts/test-email.js your-email@example.com');
  process.exit(1);
}

// Validate email format
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
if (!emailRegex.test(email)) {
  console.error('❌ Error: Invalid email format');
  process.exit(1);
}

console.log('📧 Testing email endpoint...');
console.log(`Email: ${email}`);
console.log('');

// Check if NEXT_PUBLIC_APP_URL is set
const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
const testUrl = `${appUrl}/api/test-email?to=${encodeURIComponent(email)}`;

console.log(`Testing: ${testUrl}`);
console.log('');

fetch(testUrl)
  .then(async (response) => {
    const data = await response.json();
    
    if (response.ok && data.success) {
      console.log('✅ SUCCESS!');
      console.log(`Email sent successfully!`);
      console.log(`Email ID: ${data.emailId || 'N/A'}`);
      console.log('');
      console.log(`Check your inbox at: ${email}`);
    } else {
      console.log('❌ FAILED');
      console.log(`Status: ${response.status}`);
      console.log(`Error: ${data.error || 'Unknown error'}`);
      if (data.details) {
        console.log(`Details:`, data.details);
      }
      if (data.hint) {
        console.log(`Hint: ${data.hint}`);
      }
      process.exit(1);
    }
  })
  .catch((error) => {
    console.error('❌ Network Error:', error.message);
    console.log('');
    console.log('Make sure your server is running and NEXT_PUBLIC_APP_URL is set correctly.');
    process.exit(1);
  });

