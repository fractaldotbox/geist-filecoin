import { readFileSync, writeFileSync, existsSync, mkdirSync, readdirSync } from 'node:fs';
import { join, dirname, basename } from 'node:path';
import { fileURLToPath } from 'node:url';

// Get current directory for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Import after building
const { encrypt, decrypt, generateSecureKey } = await import('../dist/src/encryption.js');

const DEFAULT_KEY = 'geist-filecoin-test-key-2024';
const BASE_DIR = join(__dirname, '..');
const UNENCRYPTED_DIR = join(BASE_DIR, 'test', 'unencrypted_data');
const ENCRYPTED_DIR = join(BASE_DIR, 'test', 'encrypted_data');
const DECRYPTED_DIR = join(BASE_DIR, 'test', 'decrypted_data');

// Ensure directories exist
if (!existsSync(ENCRYPTED_DIR)) {
  mkdirSync(ENCRYPTED_DIR, { recursive: true });
}
if (!existsSync(DECRYPTED_DIR)) {
  mkdirSync(DECRYPTED_DIR, { recursive: true });
}

function encryptAllFiles() {
  console.log('🔐 Starting encryption...\n');
  
  const files = readdirSync(UNENCRYPTED_DIR);
  
  for (const file of files) {
    try {
      console.log(`🔒 Encrypting: ${file}`);
      const content = readFileSync(join(UNENCRYPTED_DIR, file), 'utf-8');
      const encrypted = encrypt(content, DEFAULT_KEY);
      const outputPath = join(ENCRYPTED_DIR, `${file}.encrypted`);
      writeFileSync(outputPath, encrypted, 'utf-8');
      console.log(`✅ Saved: ${basename(outputPath)}`);
    } catch (error) {
      console.error(`❌ Failed to encrypt ${file}:`, error.message);
    }
  }
  
  console.log('\n✨ Encryption complete!');
}

function decryptAllFiles() {
  console.log('🔓 Starting decryption...\n');
  console.log(`Using key: ${DEFAULT_KEY}`);
  
  const files = readdirSync(ENCRYPTED_DIR);
  
  for (const file of files) {
    try {
      console.log(`🔓 Decrypting: ${file}`);
      const encryptedContent = readFileSync(join(ENCRYPTED_DIR, file), 'utf-8');
      const decrypted = decrypt(encryptedContent, DEFAULT_KEY);
      const originalName = basename(file, '.encrypted');
      const outputPath = join(DECRYPTED_DIR, originalName);
      writeFileSync(outputPath, decrypted, 'utf-8');
      console.log(`✅ Saved: ${originalName}`);
    } catch (error) {
      console.error(`❌ Failed to decrypt ${file}:`, error.message);
    }
  }
  
  console.log('\n✨ Decryption complete!');
}

function verifyRoundtrip() {
  console.log('🔄 Testing encryption/decryption...\n');
  
  const files = readdirSync(UNENCRYPTED_DIR).filter(f => f.endsWith('.json'));
  
  for (const file of files) {
    try {
      console.log(`Testing: ${file}`);
      const original = readFileSync(join(UNENCRYPTED_DIR, file), 'utf-8');
      const encrypted = encrypt(original, DEFAULT_KEY);
      const decrypted = decrypt(encrypted, DEFAULT_KEY);
      
      if (original === decrypted) {
        console.log(`✅ PASS: ${file}`);
      } else {
        console.log(`❌ FAIL: ${file} (content mismatch)`);
      }
    } catch (error) {
      console.error(`❌ ERROR: ${file}:`, error.message);
    }
  }
  
  console.log('\n✨ Verification complete!');
}

function showHelp() {
  console.log(`
🔐 Geist Filecoin Encryption Tool

Commands:
  encrypt    Encrypt all JSON files in test/unencrypted_data
  decrypt    Decrypt all .encrypted files in test/encrypted_data
  verify     Test encryption/decryption roundtrip
  generate   Generate a new secure key
  help       Show this help

Usage:
  node scripts/working-encrypt.js <command>
`);
}

// Main logic
const command = process.argv[2] || 'help';

console.log('🔐 Geist Filecoin Encryption Tool\n');

switch (command) {
  case 'encrypt':
    encryptAllFiles();
    break;
  case 'decrypt':
    decryptAllFiles();
    break;
  case 'verify':
    verifyRoundtrip();
    break;
  case 'generate':
    console.log('🔑 New secure key:', generateSecureKey());
    break;
  default:
    showHelp();
    break;
}
