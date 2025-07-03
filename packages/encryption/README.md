# Encryption Package

AES-256-GCM encryption/decryption utilities for Geist Filecoin project.

## Features

- **TypeScript Support**: Full TypeScript implementation with type definitions
- **AES-256-GCM Encryption**: Industry-standard encryption with built-in authentication
- **Key Derivation**: Secure key derivation using SHA-256 with salt
- **Safe Decryption**: Graceful fallback for non-encrypted data
- **Buffer Support**: Binary data encryption/decryption
- **Utility Functions**: Key generation and encryption detection
- **ESM Modules**: Native ES module support

## Installation

```bash
# In your package that needs encryption
npm install @geist-filecoin/encryption
```

## TypeScript Usage

This package is written in TypeScript and provides full type definitions:

```typescript
import { 
  encrypt, 
  decrypt, 
  safeDecrypt, 
  generateSecureKey,
  type DecryptionResult,
  type EncryptionResult 
} from '@geist-filecoin/encryption';

const password: string = 'your-secure-key';
const plaintext: string = 'Hello, World!';

// Encrypt
const encrypted: string = encrypt(plaintext, password);
console.log('Encrypted:', encrypted);

// Decrypt
const decrypted: string = decrypt(encrypted, password);
console.log('Decrypted:', decrypted);

// Safe decryption with type safety
const result: DecryptionResult = safeDecrypt(data, password);
console.log('Data:', result.decryptedData);
console.log('Was encrypted:', result.isEncrypted);
```

## Usage

### Basic Encryption/Decryption

```javascript
import { encrypt, decrypt } from '@geist-filecoin/encryption';

const password = 'your-secure-key';
const plaintext = 'Hello, World!';

// Encrypt
const encrypted = encrypt(plaintext, password);
console.log('Encrypted:', encrypted);

// Decrypt
const decrypted = decrypt(encrypted, password);
console.log('Decrypted:', decrypted);
```

### Safe Decryption (with fallback)

```javascript
import { safeDecrypt } from '@geist-filecoin/encryption';

const password = 'your-secure-key';
const data = 'might be encrypted or plain text';

const result = safeDecrypt(data, password);
console.log('Data:', result.decryptedData);
console.log('Was encrypted:', result.wasEncrypted);
```

### Buffer Encryption

```javascript
import { encryptBuffer, decryptToBuffer, safeDecryptBuffer } from '@geist-filecoin/encryption';

const password = 'your-secure-key';
const buffer = Buffer.from('binary data');

// Encrypt buffer
const encrypted = encryptBuffer(buffer, password);

// Decrypt buffer
const decryptedBuffer = decryptToBuffer(encrypted, password);

// Safe buffer decryption
const result = safeDecryptBuffer(someBuffer, password);
console.log('Buffer:', result.buffer);
console.log('Was encrypted:', result.wasEncrypted);
```

### Key Generation

```javascript
import { generateSecureKey } from '@geist-filecoin/encryption';

const key = generateSecureKey();
console.log('Generated key:', key);
```

## API Reference

### Functions

#### `encrypt(plaintext: string, password: string): string`
Encrypts plaintext using AES-256-GCM.

#### `decrypt(encryptedData: string, password: string): string`
Decrypts data encrypted with `encrypt()`.

#### `safeDecrypt(data: string, password: string): DecryptionResult`
Attempts decryption with graceful fallback for non-encrypted data.

#### `generateSecureKey(): string`
Generates a cryptographically secure 256-bit key.

#### `isLikelyEncrypted(data: string): boolean`
Checks if data appears to be encrypted (base64 format with minimum length).

#### `encryptBuffer(buffer: Buffer, password: string): string`
Encrypts binary data.

#### `decryptToBuffer(encryptedData: string, password: string): Buffer`
Decrypts to binary data.

#### `safeDecryptBuffer(data: Buffer, password: string): {buffer: Buffer, wasEncrypted: boolean}`
Safe buffer decryption with fallback.

### Types

```typescript
interface DecryptionResult {
  decryptedData: string;
  isEncrypted: boolean;
}

interface EncryptionResult {
  encryptedData: string;
  metadata: {
    algorithm: string;
    keySize: number;
    ivLength: number;
    saltLength: number;
    tagLength: number;
  };
}
```

## Security Features

- **AES-256-GCM**: Advanced Encryption Standard with Galois/Counter Mode
- **Authentication**: Built-in authentication prevents tampering
- **Random IV/Salt**: Each encryption uses unique initialization vector and salt
- **Secure Key Derivation**: SHA-256 based key derivation with salt

## Scripts

### TurboRepo Monorepo Commands (from root directory)

Since this is part of a TurboRepo monorepo, **run these commands from the root directory**:

```bash
# Run tests for the encryption package
pnpm test --filter=@geist-filecoin/encryption

# Build the encryption package  
pnpm build --filter=@geist-filecoin/encryption

# Run tests in watch mode
pnpm --filter=@geist-filecoin/encryption test:watch

# Generate a secure encryption key
pnpm --filter=@geist-filecoin/encryption generate-key

# Lint the encryption package
pnpm lint --filter=@geist-filecoin/encryption
```

### Local Development (from package directory)

If working directly in `packages/encryption/`:

```bash
# Run tests with Vitest
pnpm test

# Run tests in watch mode
pnpm test:watch

# Build TypeScript to JavaScript
pnpm build

# Build in development mode (watch for changes)
pnpm dev

# Generate a secure encryption key
pnpm generate-key

# Lint code with Biome
pnpm lint
```

## Development

This package is built with TypeScript and uses modern development tools:

### Testing with Vitest

- **Test Framework**: Vitest for fast, modern testing
- **Watch Mode**: Real-time test execution during development
- **TypeScript**: Full TypeScript support in tests

### Build System

- **Source Code**: All source code is in TypeScript (`.ts` files)
- **Build Output**: Compiled JavaScript and type definitions in `dist/`
- **Type Definitions**: Generated `.d.ts` files for full TypeScript support
- **ES Modules**: Uses native ES module syntax
- **Strict Mode**: TypeScript strict mode enabled for better type safety

### File Structure

```text
src/
├── index.ts          # Main exports
└── encryption.ts     # Core encryption implementation
test/
└── encryption.test.ts # Vitest test file
scripts/
└── generate-key.ts   # Key generation utility
dist/                 # Compiled output (generated)
├── src/
│   ├── index.js
│   ├── index.d.ts
│   ├── encryption.js
│   └── encryption.d.ts
└── ...
```

## Constants

```javascript
import { ENCRYPTION_CONFIG } from '@geist-filecoin/encryption';

console.log(ENCRYPTION_CONFIG.ALGORITHM); // 'aes-256-gcm'
console.log(ENCRYPTION_CONFIG.KEY_SIZE);  // 32 bytes
console.log(ENCRYPTION_CONFIG.IV_LENGTH); // 16 bytes
```
