import type { NextRequest } from 'next/server';
import type { ApiInfoResponse } from '../../../types/api.js';
import { StorageProvider } from '@geist-filecoin/storage';

export async function GET(request: NextRequest) {
  const apiInfo: ApiInfoResponse = {
    name: 'Geist Filecoin Retrieval API',
    version: 'v1',
    description: 'API for retrieving files from decentralized storage providers',
    endpoints: {
      health: '/api/v1/health',
      files: '/api/v1/files/{cid}',
      filesUnencrypted: '/api/v1/files/{cid}/unencrypted',
      spaces: '/api/v1/spaces/{did}',
    },
    supportedProviders: Object.values(StorageProvider),
    documentation: 'https://github.com/geist-filecoin/retrieval',
  };

  return new Response(JSON.stringify(apiInfo), {
    headers: {
      'Content-Type': 'application/json',
      'X-API-Version': 'v1',
    },
  });
}
