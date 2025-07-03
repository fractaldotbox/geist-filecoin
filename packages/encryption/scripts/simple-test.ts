import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs';
import { join, dirname, basename } from 'node:path';
import { fileURLToPath } from 'node:url';
import { encrypt, decrypt } from '../src/encryption.js';

// Get current directory for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Default encryption key
const DEFAULT_KEY = 'geist-filecoin-test-key-2024';

// Directories
const BASE_DIR = join(__dirname, '..');
const UNENCRYPTED_DIR = join(BASE_DIR, 'test', 'unencrypted_data');
const ENCRYPTED_DIR = join(BASE_DIR, 'test', 'encrypted_data');
const DECRYPTED_DIR = join(BASE_DIR, 'test', 'decrypted_data');

console.log('🔐 Simple Encrypt/Decrypt Test');
console.log('Base dir:', BASE_DIR);
console.log('Unencrypted dir:', UNENCRYPTED_DIR);
console.log('Encrypted dir:', ENCRYPTED_DIR);
console.log('Directory exists:', existsSync(UNENCRYPTED_DIR));

// List files
if (existsSync(UNENCRYPTED_DIR)) {
  const fs = await import('node:fs');
  const files = fs.readdirSync(UNENCRYPTED_DIR);
  console.log('Files found:', files);
  
  // Ensure output directory exists
  if (!existsSync(ENCRYPTED_DIR)) {
    mkdirSync(ENCRYPTED_DIR, { recursive: true });
  }
  
  // Process first JSON file
  const jsonFiles = files.filter(f => f.endsWith('.json'));
  if (jsonFiles.length > 0) {
    const firstFile = jsonFiles[0];
    console.log(`\nTesting with: ${firstFile}`);
    
    // Read file
    const content = readFileSync(join(UNENCRYPTED_DIR, firstFile), 'utf-8');
    console.log(`Original size: ${content.length} characters`);
    
    // Encrypt
    console.log('🔒 Encrypting...');
    const encrypted = encrypt(content, DEFAULT_KEY);
    console.log(`Encrypted size: ${encrypted.length} characters`);
    
    // Save encrypted file
    const encryptedPath = join(ENCRYPTED_DIR, `${firstFile}.encrypted`);
    writeFileSync(encryptedPath, encrypted, 'utf-8');
    console.log(`💾 Saved: ${encryptedPath}`);
    
    // Decrypt
    console.log('🔓 Decrypting...');
    const decrypted = decrypt(encrypted, DEFAULT_KEY);
    console.log(`Decrypted size: ${decrypted.length} characters`);
    
    // Verify
    const isMatch = content === decrypted;
    console.log(`✅ Verification: ${isMatch ? 'PASSED' : 'FAILED'}`);
    
    if (isMatch) {
      console.log('\n🎉 Encryption/decryption test successful!');
    } else {
      console.log('\n❌ Test failed - content mismatch');
    }
  }
} else {
  console.log('❌ Unencrypted data directory not found');
}
