import type { NextRequest } from 'next/server';
import { initStorachaClient, listFiles } from '@geist-filecoin/storage';
import type { FileMetadata, SpaceFilesResponse } from '../../../../../types/api.js';

// Environment variables for storage
const STORACHA_KEY = process.env.VITE_STORACHA_KEY || '';
const STORACHA_PROOF = process.env.VITE_STORACHA_PROOF || '';

export async function GET(request: NextRequest, { params }: { params: Promise<{ did: string }> }) {
  const { did: spaceDid } = await params;
  
  if (!spaceDid) {
    return new Response('Space DID is required', { status: 400 });
  }

  try {
    // Initialize Storacha client
    const { client } = await initStorachaClient({
      keyString: STORACHA_KEY,
      proofString: STORACHA_PROOF,
    });

    // List files in the space
    const files = await listFiles({
      client,
      spaceDid: spaceDid as any, // Type assertion for DID
    });

    // Transform the files data to include paths and metadata
    const filesData: FileMetadata[] = files.results?.map((file: any) => ({
      cid: file.root.toString(),
      name: file.name || 'unnamed',
      size: file.size || 0,
      created: file.inserted || new Date().toISOString(),
      shards: file.shards?.map((shard: any) => shard.toString()) || [],
    })) || [];

    const response: SpaceFilesResponse = {
      spaceDid,
      files: filesData,
      total: files.results?.length || 0,
    };

    return new Response(JSON.stringify(response), {
      headers: {
        'Content-Type': 'application/json',
        'X-API-Version': 'v1',
      },
    });
  } catch (error) {
    console.error('Error listing space files:', error);
    return new Response('Error listing space files', { status: 500 });
  }
}
