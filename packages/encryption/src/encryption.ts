import { createCipheriv, createDecipheriv, randomBytes, createHash } from 'node:crypto';

// AES-256-GCM encryption configuration constants
export const ENCRYPTION_CONFIG = {
  ALGORITHM: 'aes-256-gcm' as const,
  IV_LENGTH: 16, // 16 bytes for AES
  SALT_LENGTH: 32, // 32 bytes for salt
  TAG_LENGTH: 16, // 16 bytes for authentication tag
  KEY_SIZE: 32, // 32 bytes for AES-256
} as const;

export interface EncryptionOptions {
  password: string;
}

export interface EncryptionResult {
  encryptedData: string;
  metadata: {
    algorithm: string;
    keySize: number;
    ivLength: number;
    saltLength: number;
    tagLength: number;
  };
}

export interface DecryptionOptions {
  password: string;
  encryptedData: string;
}

export interface DecryptionResult {
  decryptedData: string;
  isEncrypted: boolean;
}

/**
 * Create a 256-bit key from the password using SHA-256 with salt
 */
function deriveKey(password: string, salt: Buffer): Buffer {
  return createHash('sha256').update(password + salt.toString('hex')).digest();
}

/**
 * Generate a cryptographically secure random key for AES-256
 */
export function generateSecureKey(): string {
  const keyBuffer = randomBytes(ENCRYPTION_CONFIG.KEY_SIZE);
  return keyBuffer.toString('base64');
}

/**
 * AES-256-GCM encryption
 * @param plaintext - The text to encrypt
 * @param password - The encryption password/key
 * @returns Base64 encoded encrypted data with salt, IV, and auth tag
 */
export function encrypt(plaintext: string, password: string): string {
  try {
    const salt = randomBytes(ENCRYPTION_CONFIG.SALT_LENGTH);
    const iv = randomBytes(ENCRYPTION_CONFIG.IV_LENGTH);
    const key = deriveKey(password, salt);
    
    const cipher = createCipheriv(ENCRYPTION_CONFIG.ALGORITHM, key, iv);
    let encrypted = cipher.update(plaintext, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    const authTag = cipher.getAuthTag();
    
    // Combine salt + iv + authTag + encrypted data
    const combined = Buffer.concat([
      salt,
      iv,
      authTag,
      Buffer.from(encrypted, 'hex')
    ]);
    
    return combined.toString('base64');
  } catch (error) {
    throw new Error(`Encryption failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * AES-256-GCM decryption
 * @param encryptedData - Base64 encoded encrypted data
 * @param password - The decryption password/key
 * @returns Decrypted plaintext
 */
export function decrypt(encryptedData: string, password: string): string {
  try {
    const combined = Buffer.from(encryptedData, 'base64');
    
    // Validate minimum length
    const minLength = ENCRYPTION_CONFIG.SALT_LENGTH + ENCRYPTION_CONFIG.IV_LENGTH + ENCRYPTION_CONFIG.TAG_LENGTH;
    if (combined.length < minLength) {
      throw new Error('Invalid encrypted data format: insufficient length');
    }
    
    // Extract components
    const salt = combined.subarray(0, ENCRYPTION_CONFIG.SALT_LENGTH);
    const iv = combined.subarray(ENCRYPTION_CONFIG.SALT_LENGTH, ENCRYPTION_CONFIG.SALT_LENGTH + ENCRYPTION_CONFIG.IV_LENGTH);
    const authTag = combined.subarray(ENCRYPTION_CONFIG.SALT_LENGTH + ENCRYPTION_CONFIG.IV_LENGTH, ENCRYPTION_CONFIG.SALT_LENGTH + ENCRYPTION_CONFIG.IV_LENGTH + ENCRYPTION_CONFIG.TAG_LENGTH);
    const encrypted = combined.subarray(ENCRYPTION_CONFIG.SALT_LENGTH + ENCRYPTION_CONFIG.IV_LENGTH + ENCRYPTION_CONFIG.TAG_LENGTH);
    
    const key = deriveKey(password, salt);
    
    const decipher = createDecipheriv(ENCRYPTION_CONFIG.ALGORITHM, key, iv);
    decipher.setAuthTag(authTag);
    
    let decrypted = decipher.update(encrypted, undefined, 'utf8');
    decrypted += decipher.final('utf8');
    
    return decrypted;
  } catch (error) {
    throw new Error(`Decryption failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Check if a string appears to be base64 encoded (our encrypted format)
 */
export function isLikelyEncrypted(data: string): boolean {
  // Check if it's a valid base64 string and has minimum length for encrypted data
  const base64Regex = /^[A-Za-z0-9+/]+=*$/;
  const minEncryptedLength = Math.ceil((ENCRYPTION_CONFIG.SALT_LENGTH + ENCRYPTION_CONFIG.IV_LENGTH + ENCRYPTION_CONFIG.TAG_LENGTH + 1) * 4 / 3);
  
  return base64Regex.test(data) && data.length >= minEncryptedLength;
}

/**
 * Attempt to decrypt data with graceful fallback
 * @param data - The data to potentially decrypt
 * @param password - The decryption password/key
 * @returns Object containing decrypted data and whether it was encrypted
 */
export function safeDecrypt(data: string, password: string): DecryptionResult {
  if (!isLikelyEncrypted(data)) {
    return {
      decryptedData: data,
      isEncrypted: false
    };
  }
  
  try {
    const decryptedData = decrypt(data, password);
    return {
      decryptedData,
      isEncrypted: true
    };
  } catch (error) {
    // If decryption fails, return original data
    console.warn('Decryption failed, returning original data:', error instanceof Error ? error.message : 'Unknown error');
    return {
      decryptedData: data,
      isEncrypted: false
    };
  }
}

/**
 * Enhanced encryption with metadata
 */
export function encryptWithMetadata(plaintext: string, password: string): EncryptionResult {
  const encryptedData = encrypt(plaintext, password);
  
  return {
    encryptedData,
    metadata: {
      algorithm: ENCRYPTION_CONFIG.ALGORITHM,
      keySize: ENCRYPTION_CONFIG.KEY_SIZE,
      ivLength: ENCRYPTION_CONFIG.IV_LENGTH,
      saltLength: ENCRYPTION_CONFIG.SALT_LENGTH,
      tagLength: ENCRYPTION_CONFIG.TAG_LENGTH,
    }
  };
}

/**
 * Buffer-based encryption for binary data
 */
export function encryptBuffer(buffer: Buffer, password: string): string {
  return encrypt(buffer.toString('base64'), password);
}

/**
 * Buffer-based decryption for binary data
 */
export function decryptToBuffer(encryptedData: string, password: string): Buffer {
  const decryptedBase64 = decrypt(encryptedData, password);
  return Buffer.from(decryptedBase64, 'base64');
}

/**
 * Safe buffer decryption with graceful fallback
 */
export function safeDecryptBuffer(data: Buffer, password: string): { buffer: Buffer; isEncrypted: boolean } {
  const dataString = data.toString('utf8');
  
  if (!isLikelyEncrypted(dataString)) {
    return {
      buffer: data,
      isEncrypted: false
    };
  }
  
  try {
    const decryptedBuffer = decryptToBuffer(dataString, password);
    return {
      buffer: decryptedBuffer,
      isEncrypted: true
    };
  } catch (error) {
    console.warn('Buffer decryption failed, returning original data:', error instanceof Error ? error.message : 'Unknown error');
    return {
      buffer: data,
      isEncrypted: false
    };
  }
}
