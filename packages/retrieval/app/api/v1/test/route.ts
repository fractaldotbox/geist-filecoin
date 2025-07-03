import type { NextRequest } from 'next/server';
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { join } from 'node:path';
import { encrypt, decrypt, encryptBuffer, decryptToBuffer } from '@geist-filecoin/encryption';

export async function ENCRYPTFILE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const filename = searchParams.get('filename') || 'blog.json';
    
    // Read the unencrypted file as buffer to handle both text and binary files
    const filePath = join(process.cwd(), 'app/api/v1/test/unencrypted_data', filename);
    const fileBuffer = await readFile(filePath);
    
    // Encrypt the content using encryptBuffer for proper binary handling
    const encryptionPassword = 'your-encryption-key'; // TODO: Make this configurable via env variable
    const encryptedContent = encryptBuffer(fileBuffer, encryptionPassword);
    
    // Ensure encrypted_data directory exists
    const encryptedDataDir = join(process.cwd(), 'app/api/v1/test/encrypted_data');
    await mkdir(encryptedDataDir, { recursive: true });
    
    // Write the encrypted content to the encrypted_data folder
    const encryptedFilePath = join(encryptedDataDir, `${filename}.encrypted`);
    await writeFile(encryptedFilePath, encryptedContent, 'utf-8');

    return new Response(JSON.stringify({ 
      message: 'File encrypted successfully',
      inputFile: `unencrypted_data/${filename}`,
      outputFile: `encrypted_data/${filename}.encrypted`,
      encryptedSize: encryptedContent.length,
      originalSize: fileBuffer.length
    }), {
      headers: {
        'Content-Type': 'application/json',
      },
    });
  } catch (error) {
    const { searchParams } = new URL(request.url);
    return new Response(JSON.stringify({ 
      error: `Failed to encrypt ${searchParams.get('filename') || 'blog.json'}`,
      message: error instanceof Error ? error.message : 'Unknown error'
    }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }
}

export async function GETPLAIN(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const filename = searchParams.get('filename') || 'blog.json';
    
    const filePath = join(process.cwd(), 'app/api/v1/test/unencrypted_data', filename);
    const fileContent = await readFile(filePath, 'utf-8');
    const fileData = JSON.parse(fileContent);

    return new Response(JSON.stringify(fileData), {
      headers: {
        'Content-Type': 'application/json',
      },
    });
  } catch (error) {
    const { searchParams } = new URL(request.url);
    return new Response(JSON.stringify({ 
      error: `Failed to read ${searchParams.get('filename') || 'blog.json'}`,
      message: error instanceof Error ? error.message : 'Unknown error'
    }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }
}

export async function DECRYPTFILE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const filename = searchParams.get('filename') || 'blog.json';
    
    // Read the encrypted file
    const encryptedFilePath = join(process.cwd(), 'app/api/v1/test/encrypted_data', `${filename}.encrypted`);
    const encryptedContent = await readFile(encryptedFilePath, 'utf-8');
    
    // Decrypt the content using decryptToBuffer for proper binary handling
    const encryptionPassword = 'your-encryption-key'; // TODO: Make this configurable via env variable
    const decryptedBuffer = decryptToBuffer(encryptedContent, encryptionPassword);
    
    // Ensure decrypted_data directory exists
    const decryptedDataDir = join(process.cwd(), 'app/api/v1/test/decrypted_data');
    await mkdir(decryptedDataDir, { recursive: true });
    
    // Write the decrypted content to the decrypted_data folder as buffer
    const decryptedFilePath = join(decryptedDataDir, filename);
    await writeFile(decryptedFilePath, decryptedBuffer);

    return new Response(JSON.stringify({ 
      message: 'File decrypted successfully',
      inputFile: `encrypted_data/${filename}.encrypted`,
      outputFile: `decrypted_data/${filename}`,
      decryptedSize: decryptedBuffer.length
    }), {
      headers: {
        'Content-Type': 'application/json',
      },
    });
  } catch (error) {
    const { searchParams } = new URL(request.url);
    return new Response(JSON.stringify({ 
      error: `Failed to decrypt ${searchParams.get('filename') || 'blog.json'}.encrypted`,
      message: error instanceof Error ? error.message : 'Unknown error'
    }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }
}

export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url);
    const operation = searchParams.get('operation');
    
    switch (operation) {
        case 'E':
            return ENCRYPTFILE(request);
        case 'D':
            return DECRYPTFILE(request);
        case 'G':
            return GETPLAIN(request);
        default:
            // Default to encryption if no operation specified
            return Response.json({
                'message': 'Nothing',
            });
    }
}
