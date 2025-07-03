#!/usr/bin/env node

import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs';
import { join, dirname, basename, extname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { encrypt, decrypt, safeDecrypt, generateSecureKey } from '../src/encryption.js';

// Get current directory for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Default encryption key (in production, this should be from environment variables)
const DEFAULT_KEY = 'geist-filecoin-test-key-2024';

// Directories
const UNENCRYPTED_DIR = join(__dirname, '../../test/unencrypted_data');
const ENCRYPTED_DIR = join(__dirname, '../../test/encrypted_data');
const DECRYPTED_DIR = join(__dirname, '../../test/decrypted_data');

/**
 * Display help information
 */
function showHelp(): void {
  console.log(`
🔐 Geist Filecoin Encryption Tool

Usage:
  pnpm run encrypt-files [command] [options]

Commands:
  encrypt     Encrypt all files in test/unencrypted_data
  decrypt     Decrypt all files in test/encrypted_data  
  verify      Encrypt then decrypt to verify roundtrip
  generate    Generate a new secure encryption key
  help        Show this help message

Options:
  --key <key>    Use custom encryption key (default: test key)
  --clean        Remove output directory before processing

Examples:
  pnpm run encrypt-files encrypt
  pnpm run encrypt-files decrypt --key "your-secret-key"
  pnpm run encrypt-files verify --clean
  pnpm run encrypt-files generate
`);
}

/**
 * Parse command line arguments
 */
function parseArgs(): { command: string; key: string; clean: boolean } {
  const args = process.argv.slice(2);
  const command = args[0] || 'help';
  
  let key = DEFAULT_KEY;
  let clean = false;
  
  for (let i = 1; i < args.length; i++) {
    if (args[i] === '--key' && args[i + 1]) {
      key = args[i + 1];
      i++; // Skip next arg
    } else if (args[i] === '--clean') {
      clean = true;
    }
  }
  
  return { command, key, clean };
}

/**
 * Ensure directory exists
 */
function ensureDir(dirPath: string): void {
  if (!existsSync(dirPath)) {
    mkdirSync(dirPath, { recursive: true });
    console.log(`📁 Created directory: ${dirPath}`);
  }
}

/**
 * Remove and recreate directory
 */
function cleanDir(dirPath: string): void {
  if (existsSync(dirPath)) {
    // Remove directory recursively (Node.js 14.14+)
    import('node:fs').then(({ rmSync }) => {
      rmSync(dirPath, { recursive: true, force: true });
      console.log(`🧹 Cleaned directory: ${dirPath}`);
      ensureDir(dirPath);
    }).catch(() => {
      console.warn(`⚠️  Could not clean directory: ${dirPath}`);
      ensureDir(dirPath);
    });
  } else {
    ensureDir(dirPath);
  }
}

/**
 * Get files in directory with specified extensions
 */
function getFilesInDir(dirPath: string, extensions: string[] = ['.json']): string[] {
  if (!existsSync(dirPath)) {
    return [];
  }
  
  const fs = require('node:fs');
  return fs.readdirSync(dirPath)
    .filter((file: string) => extensions.includes(extname(file).toLowerCase()))
    .map((file: string) => join(dirPath, file));
}

/**
 * Encrypt all files in the unencrypted directory
 */
function encryptFiles(key: string, clean: boolean): void {
  console.log('🔐 Starting file encryption...\n');
  
  if (clean) {
    cleanDir(ENCRYPTED_DIR);
  } else {
    ensureDir(ENCRYPTED_DIR);
  }
  
  const files = getFilesInDir(UNENCRYPTED_DIR);
  if (files.length === 0) {
    console.log('❌ No files found in unencrypted_data directory');
    return;
  }

  // log the filenames found
  console.log('📁 Files found in unencrypted_data directory:');
  files.forEach(file => console.log(`   - ${basename(file)}`));
    if (files.length === 0) {
        console.log('❌ No files found in unencrypted_data directory');
        console.log('💡 Run "pnpm run encrypt-files encrypt" first');
        return;
    }

  console.log(`📁 Found ${files.length} files to encrypt`);
  
  let successful = 0;
  let failed = 0;
  
  for (const filePath of files) {
    try {
      const filename = basename(filePath);
      const content = readFileSync(filePath, 'utf-8');
      
      console.log(`🔒 Encrypting: ${filename}`);
      const encrypted = encrypt(content, key);
      
      const outputPath = join(ENCRYPTED_DIR, `${filename}.encrypted`);
      writeFileSync(outputPath, encrypted, 'utf-8');
      
      console.log(`✅ Encrypted: ${filename} -> ${basename(outputPath)}`);
      successful++;
    } catch (error) {
      console.error(`❌ Failed to encrypt ${basename(filePath)}:`, error instanceof Error ? error.message : 'Unknown error');
      failed++;
    }
  }
  
  console.log('\n📊 Encryption Summary:');
  console.log(`   ✅ Successful: ${successful}`);
  console.log(`   ❌ Failed: ${failed}`);
  console.log(`   📁 Output directory: ${ENCRYPTED_DIR}`);
}

/**
 * Decrypt all files in the encrypted directory
 */
function decryptFiles(key: string, clean: boolean): void {
  console.log('🔓 Starting file decryption...\n');
  
  if (clean) {
    cleanDir(DECRYPTED_DIR);
  } else {
    ensureDir(DECRYPTED_DIR);
  }
  
  const files = getFilesInDir(ENCRYPTED_DIR, ['.encrypted']);
  
  if (files.length === 0) {
    console.log('❌ No encrypted files found in encrypted_data directory');
    console.log('💡 Run "pnpm run encrypt-files encrypt" first');
    return;
  }
  
  console.log(`📁 Found ${files.length} encrypted files to decrypt`);
  
  let successful = 0;
  let failed = 0;
  
  for (const filePath of files) {
    try {
      const filename = basename(filePath, '.encrypted');
      const encryptedContent = readFileSync(filePath, 'utf-8');
      
      console.log(`🔓 Decrypting: ${basename(filePath)}`);
      const decrypted = decrypt(encryptedContent, key);
      
      const outputPath = join(DECRYPTED_DIR, filename);
      writeFileSync(outputPath, decrypted, 'utf-8');
      
      console.log(`✅ Decrypted: ${basename(filePath)} -> ${filename}`);
      successful++;
    } catch (error) {
      console.error(`❌ Failed to decrypt ${basename(filePath)}:`, error instanceof Error ? error.message : 'Unknown error');
      failed++;
    }
  }
  
  console.log('\n📊 Decryption Summary:');
  console.log(`   ✅ Successful: ${successful}`);
  console.log(`   ❌ Failed: ${failed}`);
  console.log(`   📁 Output directory: ${DECRYPTED_DIR}`);
}

/**
 * Verify encryption/decryption roundtrip
 */
function verifyRoundtrip(key: string, clean: boolean): void {
  console.log('🔄 Starting encryption/decryption verification...\n');
  
  const files = getFilesInDir(UNENCRYPTED_DIR);
  
  if (files.length === 0) {
    console.log('❌ No files found in unencrypted_data directory');
    return;
  }
  
  let successful = 0;
  let failed = 0;
  
  for (const filePath of files) {
    try {
      const filename = basename(filePath);
      const originalContent = readFileSync(filePath, 'utf-8');
      
      console.log(`🔄 Testing: ${filename}`);
      
      // Encrypt
      const encrypted = encrypt(originalContent, key);
      console.log(`  🔒 Encrypted (${encrypted.length} chars)`);
      
      // Decrypt
      const decrypted = decrypt(encrypted, key);
      console.log(`  🔓 Decrypted (${decrypted.length} chars)`);
      
      // Verify
      if (originalContent === decrypted) {
        console.log(`  ✅ Verification passed: ${filename}`);
        successful++;
      } else {
        console.log(`  ❌ Verification failed: ${filename} (content mismatch)`);
        failed++;
      }
    } catch (error) {
      console.error(`❌ Verification failed for ${basename(filePath)}:`, error instanceof Error ? error.message : 'Unknown error');
      failed++;
    }
  }
  
  console.log('\n📊 Verification Summary:');
  console.log(`   ✅ Passed: ${successful}`);
  console.log(`   ❌ Failed: ${failed}`);
  
  if (failed === 0) {
    console.log('\n🎉 All files passed encryption/decryption verification!');
  }
}

/**
 * Generate a new secure encryption key
 */
function generateKey(): void {
  console.log('🔑 Generating new secure encryption key...\n');
  
  const newKey = generateSecureKey();
  
  console.log('✅ New encryption key generated:');
  console.log(`🔑 Key: ${newKey}`);
  console.log(`📏 Length: ${newKey.length} characters`);
  console.log('🔐 Algorithm: AES-256-GCM with SHA-256 key derivation');
  
  console.log('\n💡 Usage:');
  console.log(`   pnpm run encrypt-files encrypt --key "${newKey}"`);
  console.log(`   pnpm run encrypt-files decrypt --key "${newKey}"`);
  
  console.log('\n⚠️  Important:');
  console.log('   - Store this key securely');
  console.log('   - Do not commit keys to version control');
  console.log('   - Use environment variables in production');
}

/**
 * Main function
 */
function main(): void {
  const { command, key, clean } = parseArgs();
  
  console.log('🔐 Geist Filecoin Encryption Tool\n');
  
  switch (command) {
    case 'encrypt':
      encryptFiles(key, clean);
      break;
      
    case 'decrypt':
      decryptFiles(key, clean);
      break;
      
    case 'verify':
      verifyRoundtrip(key, clean);
      break;
      
    case 'generate':
      generateKey();
      break;
      
    default:
      showHelp();
      break;
  }
}

// Run if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}
