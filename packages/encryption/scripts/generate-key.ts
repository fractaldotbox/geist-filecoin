#!/usr/bin/env node

/**
 * Utility script to generate a secure AES-256 encryption key
 * Run with: npm run generate-key
 */

import { generateSecureKey } from '../src/encryption.js';

function generateKey(): void {
  const key: string = generateSecureKey();
  
  console.log('🔐 Generated secure AES-256 encryption key:');
  console.log('');
  console.log(`ENCRYPTION_KEY=${key}`);
  console.log('');
  console.log('📋 Copy the above line to your .env.local file');
  console.log('⚠️  Keep this key secure and never commit it to version control!');
  console.log('');
  console.log('Key details:');
  console.log('- Length: 32 bytes (256 bits)');
  console.log('- Format: Base64 encoded');
  console.log('- Algorithm: Suitable for AES-256');
}

// Check if we're running in Node.js
if (typeof window === 'undefined') {
  generateKey();
} else {
  console.log('This script should be run in Node.js environment');
}
