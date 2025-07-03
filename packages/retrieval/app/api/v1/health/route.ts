import type { NextRequest } from 'next/server';
import type { HealthCheckResponse } from '../../../../types/api.js';

// Environment variables for encryption and storage
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || 'default-key-change-me-this-is-not-secure';
const STORACHA_KEY = process.env.VITE_STORACHA_KEY || '';
const STORACHA_PROOF = process.env.VITE_STORACHA_PROOF || '';

export async function GET(request: NextRequest) {
  const healthStatus: HealthCheckResponse = {
    status: 'healthy',
    version: 'v1',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: {
      node: process.version,
      platform: process.platform,
      arch: process.arch,
    },
    services: {
      storacha: {
        configured: !!(STORACHA_KEY && STORACHA_PROOF),
        status: (STORACHA_KEY && STORACHA_PROOF) ? 'ready' : 'not_configured'
      },
      encryption: {
        configured: ENCRYPTION_KEY !== 'default-key-change-me-this-is-not-secure',
        status: ENCRYPTION_KEY !== 'default-key-change-me-this-is-not-secure' ? 'ready' : 'using_default_key'
      }
    }
  };

  return new Response(JSON.stringify(healthStatus), {
    headers: {
      'Content-Type': 'application/json',
    },
  });
}
