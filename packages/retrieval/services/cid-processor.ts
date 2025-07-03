import { unixfs } from '@helia/unixfs';
import { createHelia } from 'helia';
import type { CID } from 'multiformats/cid';
import type { UnixFS } from '@helia/unixfs';
import type { Helia } from '@helia/interface';

export interface FileEntry {
  name: string;
  path: string;
  cid: string;
  size: number;
  type: 'file' | 'directory' | 'raw';
  content?: Uint8Array;
}

export interface DirectoryStructure {
  cid: string;
  type: 'directory';
  name?: string;
  files: FileEntry[];
  totalSize: number;
}

export interface FileContent {
  cid: string;
  type: 'file' | 'raw';
  content: Uint8Array;
  size: number;
}

export type CIDProcessResult = DirectoryStructure | FileContent;

let heliaInstance: Helia | null = null;

async function getHeliaInstance(): Promise<Helia> {
  if (!heliaInstance) {
    heliaInstance = await createHelia();
  }
  return heliaInstance;
}

/**
 * Process a CID and return either directory structure or file content
 */
export async function processCid(cid: CID): Promise<CIDProcessResult> {
  const helia = await getHeliaInstance();
  const fs = unixfs(helia);
  
  try {
    // First, determine the type of the CID
    const stats = await fs.stat(cid);
    
    if (stats.type === 'directory') {
      return await processDirectory(fs, cid);
    }
    
    if (stats.type === 'file' || stats.type === 'raw') {
      return await processFile(fs, cid, stats.type);
    }
    
    throw new Error(`Unsupported CID type: ${stats.type}`);
  } catch (error) {
    console.error('Error processing CID:', error);
    throw new Error(`Failed to process CID: ${cid.toString()}`);
  }
}

/**
 * Process a directory CID and return its structure
 */
async function processDirectory(fs: UnixFS, cid: CID, basePath = ''): Promise<DirectoryStructure> {
  const files: FileEntry[] = [];
  let totalSize = 0;
  
  for await (const entry of fs.ls(cid)) {
    const fullPath = basePath ? `${basePath}/${entry.name}` : entry.name || '';
    
    if (entry.type === 'file' || entry.type === 'raw') {
      const fileEntry: FileEntry = {
        name: entry.name || entry.cid.toString(),
        path: fullPath,
        cid: entry.cid.toString(),
        size: Number(entry.size || 0),
        type: entry.type,
      };
      files.push(fileEntry);
      totalSize += Number(entry.size || 0);
    } else if (entry.type === 'directory') {
      // Recursively process subdirectories
      const subDirectory = await processDirectory(fs, entry.cid, fullPath);
      
      // Add directory entry
      const dirEntry: FileEntry = {
        name: entry.name || entry.cid.toString(),
        path: fullPath,
        cid: entry.cid.toString(),
        size: subDirectory.totalSize,
        type: 'directory',
      };
      files.push(dirEntry);
      
      // Add all files from subdirectory
      files.push(...subDirectory.files);
      totalSize += subDirectory.totalSize;
    }
  }
  
  return {
    cid: cid.toString(),
    type: 'directory',
    files,
    totalSize,
  };
}

/**
 * Process a file CID and return its content
 */
async function processFile(fs: UnixFS, cid: CID, type: 'file' | 'raw'): Promise<FileContent> {
  const chunks: Uint8Array[] = [];
  
  for await (const chunk of fs.cat(cid)) {
    chunks.push(chunk);
  }
  
  // Combine all chunks into a single Uint8Array
  const totalLength = chunks.reduce((acc, chunk) => acc + chunk.length, 0);
  const result = new Uint8Array(totalLength);
  let offset = 0;
  
  for (const chunk of chunks) {
    result.set(chunk, offset);
    offset += chunk.length;
  }
  
  return {
    cid: cid.toString(),
    type,
    content: result,
    size: result.length,
  };
}

/**
 * Get file paths from a directory CID (flattened list)
 */
export async function getFilePaths(cid: CID): Promise<string[]> {
  const result = await processCid(cid);
  
  if (result.type === 'directory') {
    return result.files
      .filter(file => file.type === 'file' || file.type === 'raw')
      .map(file => file.path);
  }
  
  // For single files, return the CID as the path
  return [cid.toString()];
}

/**
 * Get specific file content from a directory by path
 */
export async function getFileFromDirectory(directoryCid: CID, filePath: string): Promise<Uint8Array | null> {
  const helia = await getHeliaInstance();
  const fs = unixfs(helia);
  
  try {
    // Navigate through the path
    const pathParts = filePath.split('/').filter(part => part.length > 0);
    let currentCid = directoryCid;
    
    for (const part of pathParts) {
      let found = false;
      
      for await (const entry of fs.ls(currentCid)) {
        if (entry.name === part) {
          currentCid = entry.cid;
          found = true;
          break;
        }
      }
      
      if (!found) {
        return null;
      }
    }
    
    // Get the file content
    const fileResult = await processFile(fs, currentCid, 'file');
    return fileResult.content;
  } catch (error) {
    console.error('Error getting file from directory:', error);
    return null;
  }
}

/**
 * Cleanup Helia instance
 */
export async function cleanup(): Promise<void> {
  if (heliaInstance) {
    await heliaInstance.stop();
    heliaInstance = null;
  }
}
