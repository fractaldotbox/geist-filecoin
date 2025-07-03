import { describe, it, expect, beforeAll } from 'vitest';
import { 
  encrypt, 
  decrypt, 
  generateSecureKey, 
  safeDecrypt, 
  encryptBuffer, 
  decryptToBuffer,
  safeDecryptBuffer,
  isLikelyEncrypted,
  ENCRYPTION_CONFIG
} from '../src/encryption.js';
import type { DecryptionResult } from '../src/encryption.js';

// Test encryption key
const TEST_KEY = 'test-key-for-demonstration-only';

describe('AES-256-GCM Encryption/Decryption', () => {
  const testMessages = [
    'Hello, World!',
    'This is a test message with special characters: éñøðé',
    JSON.stringify({ name: 'test', value: 123, nested: { data: 'value' } }),
    'A very long message that should test the encryption with larger data amounts. '.repeat(10)
  ];

  it.each(testMessages)('should encrypt and decrypt: %s', (message) => {
    // Encrypt
    const encrypted = encrypt(message, TEST_KEY);
    expect(encrypted).toBeDefined();
    expect(typeof encrypted).toBe('string');
    expect(encrypted.length).toBeGreaterThan(0);
    
    // Decrypt
    const decrypted = decrypt(encrypted, TEST_KEY);
    expect(decrypted).toBe(message);
  });

  it('should throw error with wrong decryption key', () => {
    const message = 'Secret message';
    const encrypted = encrypt(message, TEST_KEY);
    
    expect(() => {
      decrypt(encrypted, 'wrong-key');
    }).toThrow();
  });

  it('should generate unique secure keys', () => {
    const key1 = generateSecureKey();
    const key2 = generateSecureKey();
    
    expect(key1).toBeDefined();
    expect(key2).toBeDefined();
    expect(typeof key1).toBe('string');
    expect(typeof key2).toBe('string');
    expect(key1).not.toBe(key2);
    expect(key1.length).toBeGreaterThan(0);
    expect(key2.length).toBeGreaterThan(0);
  });
});

describe('Safe Decryption', () => {
  const testCases = [
    { data: 'Plain text message', shouldBeEncrypted: false },
    { data: encrypt('Encrypted message', TEST_KEY), shouldBeEncrypted: true },
    { data: 'Not+base64!@#$%', shouldBeEncrypted: false },
    { data: 'VGhpcyBpcyBub3QgZW5jcnlwdGVk', shouldBeEncrypted: false }, // Valid base64 but not encrypted
  ];

  it.each(testCases)('should handle safe decryption for: $data', ({ data, shouldBeEncrypted }) => {
    const result: DecryptionResult = safeDecrypt(data, TEST_KEY);
    
    expect(result).toBeDefined();
    expect(result.isEncrypted).toBe(shouldBeEncrypted);
    expect(typeof result.decryptedData).toBe('string');
    
    if (shouldBeEncrypted) {
      // If it was encrypted, we should get back the original message
      expect(result.decryptedData).toBe('Encrypted message');
    } else {
      // If it wasn't encrypted, we should get back the original data
      expect(result.decryptedData).toBe(data);
    }
  });
});

describe('Buffer Encryption/Decryption', () => {
  it('should encrypt and decrypt buffers', () => {
    const originalData = 'This is binary data that will be encrypted as a buffer';
    const buffer = Buffer.from(originalData, 'utf8');
    
    // Encrypt buffer
    const encrypted = encryptBuffer(buffer, TEST_KEY);
    expect(encrypted).toBeDefined();
    expect(typeof encrypted).toBe('string');
    
    // Decrypt buffer
    const decryptedBuffer = decryptToBuffer(encrypted, TEST_KEY);
    const decryptedData = decryptedBuffer.toString('utf8');
    
    expect(decryptedBuffer).toBeInstanceOf(Buffer);
    expect(decryptedData).toBe(originalData);
    expect(decryptedBuffer.length).toBe(buffer.length);
  });

  it('should handle safe buffer decryption', () => {
    const plainBuffer = Buffer.from('Plain buffer data');
    const encryptedBufferData = Buffer.from(encryptBuffer(plainBuffer, TEST_KEY));
    
    // Test plain buffer
    const plainResult = safeDecryptBuffer(plainBuffer, TEST_KEY);
    expect(plainResult.isEncrypted).toBe(false);
    expect(plainResult.buffer.toString('utf8')).toBe('Plain buffer data');
    
    // Test encrypted buffer
    const encryptedResult = safeDecryptBuffer(encryptedBufferData, TEST_KEY);
    expect(encryptedResult.isEncrypted).toBe(true);
    expect(encryptedResult.buffer.toString('utf8')).toBe('Plain buffer data');
  });
});

describe('Utility Functions', () => {
  describe('isLikelyEncrypted', () => {
    const testStrings = [
      { str: 'Plain text', expected: false },
      { str: encrypt('test', TEST_KEY), expected: true },
      { str: 'VGVzdA==', expected: false }, // Short base64
      { str: 'Not base64!', expected: false },
    ];

    it.each(testStrings)('should detect encryption for: $str', ({ str, expected }) => {
      const result = isLikelyEncrypted(str);
      expect(result).toBe(expected);
    });
  });

  describe('ENCRYPTION_CONFIG', () => {
    it('should have correct configuration constants', () => {
      expect(ENCRYPTION_CONFIG.ALGORITHM).toBe('aes-256-gcm');
      expect(ENCRYPTION_CONFIG.KEY_SIZE).toBe(32);
      expect(ENCRYPTION_CONFIG.IV_LENGTH).toBe(16);
      expect(ENCRYPTION_CONFIG.SALT_LENGTH).toBe(32);
      expect(ENCRYPTION_CONFIG.TAG_LENGTH).toBe(16);
    });
  });
});
