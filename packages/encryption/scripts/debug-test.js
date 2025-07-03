import { readFileSync, writeFileSync, existsSync, mkdirSync, readdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

// Get current directory for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

console.log('🔐 Testing Encryption Script Setup');
console.log('Current file:', __filename);
console.log('Current dir:', __dirname);

const BASE_DIR = join(__dirname, '..');
const UNENCRYPTED_DIR = join(BASE_DIR, 'test', 'unencrypted_data');

console.log('Base dir:', BASE_DIR);
console.log('Unencrypted dir:', UNENCRYPTED_DIR);
console.log('Directory exists:', existsSync(UNENCRYPTED_DIR));

if (existsSync(UNENCRYPTED_DIR)) {
  const files = readdirSync(UNENCRYPTED_DIR);
  console.log('Files found:', files);
  
  if (files.length > 0) {
    const firstFile = files[0];
    const content = readFileSync(join(UNENCRYPTED_DIR, firstFile), 'utf-8');
    console.log(`File: ${firstFile}, Size: ${content.length} chars`);
    console.log('First 100 chars:', content.substring(0, 100));
  }
} else {
  console.log('❌ Directory not found');
}
