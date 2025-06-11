import { Router } from 'itty-router';
import { Env } from './types';

// Create a new router
const router = Router();

// Health check endpoint
router.get('/health', () => {
  return new Response('OK', { status: 200 });
});

// Generate storage proof endpoint
router.post('/generate-proof', async (request: Request, env: Env) => {
  try {
    const { pieceCID, dealID } = await request.json();

    if (!pieceCID || !dealID) {
      return new Response(
        JSON.stringify({ error: 'Missing required parameters' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // TODO: Implement actual storage proof generation logic here
    // This would typically involve:
    // 1. Fetching the piece data from storage
    // 2. Generating the proof using Filecoin's proof system
    // 3. Returning the proof

    return new Response(
      JSON.stringify({
        status: 'success',
        message: 'Proof generation endpoint ready for implementation',
        params: { pieceCID, dealID }
      }),
      { 
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
});

// Handle 404s
router.all('*', () => new Response('Not Found', { status: 404 }));

// Export the worker
export default {
  fetch: router.handle
}; 