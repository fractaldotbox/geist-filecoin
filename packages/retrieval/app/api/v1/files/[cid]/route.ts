import type { NextRequest } from 'next/server';
import { CID } from 'multiformats/cid';
import { safeDecryptBuffer } from '@geist-filecoin/encryption';
import { StorageProvider, type StorageProviderType } from '@geist-filecoin/storage';
import { processCid, getFileFromDirectory, type CIDProcessResult } from '../../../../../services/cid-processor';

// Environment variables for encryption
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || 'your-encryption-key';

export async function GET(request: NextRequest, { params }: { params: Promise<{ cid: string }> }) {
  const { searchParams } = new URL(request.url);
  const { cid: cidString } = await params;
  const providerParam = searchParams.get('provider') || StorageProvider.STORACHA;
  const provider = (providerParam as StorageProviderType) || StorageProvider.STORACHA;
  const filePath = searchParams.get('path'); // For accessing specific files in directories
  const format = searchParams.get('format') || 'auto'; // 'auto', 'json', 'binary'
  const useTestKey = searchParams.get('testKey') === 'true'; // Use test encryption key
  
  const encryptionKey = ENCRYPTION_KEY;
  
  if (!cidString) {
    return new Response('CID is required', { status: 400 });
  }

  try {
    // Parse CID
    let cid: CID;
    try {
      cid = CID.parse(cidString);
    } catch (error) {
      return new Response('Invalid CID format', { status: 400 });
    }

    // Process the CID to determine its type and content
    const result: CIDProcessResult = await processCid(cid);
    
    if (result.type === 'directory') {
      // Handle directory requests
      if (filePath) {
        console.log(`Fetching file from directory: ${filePath}`);
        // Get specific file from directory
        const fileContent = await getFileFromDirectory(cid, filePath);
        if (!fileContent) {
          return new Response('File not found in directory', { status: 404 });
        }
        
        // Decrypt if necessary
        console.log(`Decrypting file content for path: ${filePath}`);
        const decryptionResult = safeDecryptBuffer(Buffer.from(fileContent), encryptionKey);
        
        return new Response(new Uint8Array(decryptionResult.buffer), {
          headers: {
            'Content-Type': 'application/octet-stream',
            'Cache-Control': 'public, max-age=31536000',
            'X-Decrypted': decryptionResult.isEncrypted.toString(),
            'X-Content-Type': 'file',
            'X-API-Version': 'v1',
          },
        });
      }
      
      // Return directory structure as JSON
      return Response.json({
        success: true,
        type: 'directory',
        cid: result.cid,
        totalFiles: result.files.filter(f => f.type === 'file' || f.type === 'raw').length,
        totalDirectories: result.files.filter(f => f.type === 'directory').length,
        totalSize: result.totalSize,
        files: result.files.map(file => ({
          name: file.name,
          path: file.path,
          cid: file.cid,
          size: file.size,
          type: file.type,
        })),
      });
    }

    // Log the result content in string
    console.log(`Processing CID: ${cidString}`);
    console.log(`Result Type: ${result.type}`);
    console.log(`Result CID: ${result.cid}`);
    console.log(`Result Size: ${result.size} bytes`);
    console.log(`Result Content Length: ${result.content.length} bytes`);
    console.log(`Result Content Type: ${result.type}`);
    console.log(`Result Content: ${result.content.toString()}`);

    // return the result for file/raw content
    // Handle file/raw content
    const decryptionResult = safeDecryptBuffer(Buffer.from(result.content), encryptionKey);
    const finalContent = decryptionResult.buffer;
    const isEncrypted = decryptionResult.isEncrypted;

    // Return file content as JSON if requested
    if (format === 'json') {
      return Response.json({
        success: true,
        type: result.type,
        cid: result.cid,
        size: result.size,
        isEncrypted,
        content: Array.from(new Uint8Array(finalContent)), // Convert to array for JSON
      });
    }

    // Determine content type for binary response
    let contentType = 'application/octet-stream'; // Default to application/octet-stream for auto detection
    const firstBytes = new Uint8Array(finalContent.slice(0, 4));
    // console.log(firstBytes);
    if (firstBytes[0] === 0xFF && firstBytes[1] === 0xD8) {
      contentType = 'image/jpeg';
    } else if (firstBytes[0] === 0x89 && firstBytes[1] === 0x50 && firstBytes[2] === 0x4E && firstBytes[3] === 0x47) {
      contentType = 'image/png';
    } else if (firstBytes[0] === 0x47 && firstBytes[1] === 0x49 && firstBytes[2] === 0x46) {
      contentType = 'image/gif';
    } else {
      // Try to detect if it's text
      try {
        const text = new TextDecoder('utf-8', { fatal: true }).decode(new Uint8Array(finalContent.slice(0, 1024)));
        if (text) {
          contentType = 'text/plain; charset=utf-8';
        }
      } catch {
        // Not valid UTF-8, keep as binary
      }
    }
    
    return new Response(new Uint8Array(finalContent), {
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=31536000',
        'X-Decrypted': isEncrypted.toString(),
        'X-Content-Type': result.type,
        'X-Content-Size': result.size.toString(),
        'X-API-Version': 'v1',
      },
    });
  } catch (error) {
    console.error('Error processing CID:', error);
    return new Response(`Error processing CID: ${error instanceof Error ? error.message : 'Unknown error'}`, { 
      status: 500 
    });
  }
}
