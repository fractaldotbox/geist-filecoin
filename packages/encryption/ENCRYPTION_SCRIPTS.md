# Encryption Scripts Documentation

This document describes the encryption and decryption scripts available in the Geist Filecoin encryption package.

## Overview

The encryption package includes scripts to encrypt and decrypt files in the `test/unencrypted_data` directory using AES-256-GCM encryption with SHA-256 key derivation.

## Files Structure

```
packages/encryption/
├── test/
│   ├── unencrypted_data/     # Original JSON files
│   ├── encrypted_data/       # Encrypted .encrypted files
│   └── decrypted_data/       # Decrypted files for verification
├── scripts/
│   ├── working-encrypt.js    # Main encryption/decryption script
│   ├── encrypt-files.ts      # TypeScript version (more features)
│   └── generate-key.ts       # Key generation utility
└── src/
    └── encryption.ts         # Core encryption functions
```

## Working Script (Recommended)

The `working-encrypt.js` script is the recommended tool for encrypting and decrypting test files.

### Usage

```bash
# Navigate to encryption package
cd packages/encryption

# Build the package first (required)
pnpm build

# Show help
node scripts/working-encrypt.js help

# Test encryption/decryption (recommended first step)
node scripts/working-encrypt.js verify

# Encrypt all JSON files
node scripts/working-encrypt.js encrypt

# Decrypt all .encrypted files
node scripts/working-encrypt.js decrypt

# Generate a new secure key
node scripts/working-encrypt.js generate
```

### Commands

- **`verify`**: Tests encryption/decryption roundtrip on all files
- **`encrypt`**: Encrypts all `.json` files in `test/unencrypted_data/`
- **`decrypt`**: Decrypts all `.encrypted` files in `test/encrypted_data/`
- **`generate`**: Generates a new secure encryption key
- **`help`**: Shows usage information

## Test Files

The package includes sample JSON files for testing:

- **`blog.json`**: Blog post content
- **`landing.json`**: Landing page data
- **`product.json`**: Product information

## Encryption Details

- **Algorithm**: AES-256-GCM
- **Key Derivation**: SHA-256 with salt
- **Key Size**: 256 bits (32 bytes)
- **IV Length**: 16 bytes
- **Salt Length**: 32 bytes
- **Auth Tag**: 16 bytes

## Security Features

1. **Authenticated Encryption**: GCM mode provides both encryption and authentication
2. **Salt-based Key Derivation**: Each encryption uses a unique salt
3. **Random IV**: Each encryption uses a fresh initialization vector
4. **Base64 Encoding**: Encrypted output is base64 encoded for safe storage

## Example Output

### Verification Test
```bash
$ node scripts/working-encrypt.js verify
🔐 Geist Filecoin Encryption Tool

🔄 Testing encryption/decryption...

Testing: blog.json
✅ PASS: blog.json
Testing: landing.json
✅ PASS: landing.json
Testing: product.json
✅ PASS: product.json

✨ Verification complete!
```

### Encryption
```bash
$ node scripts/working-encrypt.js encrypt
🔐 Geist Filecoin Encryption Tool

🔐 Starting encryption...

🔒 Encrypting: blog.json
✅ Saved: blog.json.encrypted
🔒 Encrypting: landing.json
✅ Saved: landing.json.encrypted
🔒 Encrypting: product.json
✅ Saved: product.json.encrypted

✨ Encryption complete!
```

## Integration with Package Scripts

You can also use the npm/pnpm script:

```bash
# Using pnpm (builds automatically)
pnpm run crypt verify
pnpm run crypt encrypt
pnpm run crypt decrypt
```

## Development Notes

- The script uses ES modules and requires Node.js 14+
- The default encryption key is for testing only
- In production, use environment variables for keys
- The `verify` command is recommended before using encrypt/decrypt
- All operations create output directories automatically

## TypeScript Version

A more feature-rich TypeScript version is available in `encrypt-files.ts` with additional options like custom keys and directory cleaning, but requires compilation.
