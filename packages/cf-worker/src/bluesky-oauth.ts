import { OAuthClient } from "@atproto/oauth";
import { JoseKey } from "@atproto/jwk-jose";
import type { IRequest } from "itty-router";

const getBaseUrl = (env: any) => {
	return env.BASE_URL || env.FRONTEND_URL || 'https://geist-filecoin.com';
};

const getPrivateKey = async (env: any) => {
	// Use private key from environment or generate a default one for development
	const privateKeyString = env.OAUTH_PRIVATE_KEY;
	
	if (privateKeyString) {
		return JSON.parse(privateKeyString);
	}
	
	// Default development key (should be replaced in production)
	return {
		"kty": "EC",
		"use": "sig",
		"alg": "ES256",
		"kid": "909019ef-1aec-46db-837e-7aa65041e8c5",
		"crv": "P-256",
		"x": "9qVvbMfXhgAW9HWLetDQSeNwyZFPYLqKM2a11mU5UbY",
		"y": "omc4ExfvLTOQuE1N2Dxk7j2-oM9QtPqI1aDY2ZXBa4Y",
		"d": "_YswW6gB9hJpPqkSbQyqXkCuKJdipNu7ZYglPg0Kpig"
	};
};

export const getClientMetadata = (env: any) => {
	const baseUrl = getBaseUrl(env);
	const clientId = env.BLUESKY_CLIENT_ID || `${baseUrl}/api/oauth/client-metadata.json`;
	const redirectUri = env.BLUESKY_REDIRECT_URI || `${baseUrl}/api/auth/bluesky/callback`;
	
	return {
		client_id: clientId,
		client_name: env.OAUTH_CLIENT_NAME || "Geist Filecoin",
		client_uri: baseUrl,
		redirect_uris: [redirectUri] as [string, ...string[]],
		grant_types: ["authorization_code", "refresh_token"] as const,
		response_types: ["code"] as const,
		token_endpoint_auth_method: "private_key_jwt" as const,
		token_endpoint_auth_signing_alg: "ES256" as const,
		scope: "atproto",
		application_type: "web" as const,
		dpop_bound_access_tokens: true,
		jwks_uri: `${baseUrl}/api/oauth/jwks.json`
	};
};

export const getOAuthClient = async (env: any) => {
	const clientMetadata = getClientMetadata(env);
	const privateKey = await getPrivateKey(env);
	
	try {
		const keyset = [await JoseKey.fromImportable(privateKey)];
		return new OAuthClient({
			clientMetadata,
			keyset
		});
	} catch (error) {
		console.error('Failed to create OAuth client:', error);
		const errorMessage = error instanceof Error ? error.message : 'Unknown error';
		throw new Error(`OAuth client initialization failed: ${errorMessage}`);
	}
};

export const setupBlueskyOAuthRoutes = (router: any, { authorizeJWT, getPolicyDO }: { authorizeJWT: any, getPolicyDO: any }) => {
	// OAuth login endpoint
	router.get("/api/auth/bluesky/login", async (request: Request, env: any) => {
		try {
			const client = await getOAuthClient(env);
			const url = new URL(request.url);
			const state = crypto.randomUUID();
			
			// Store state in KV for validation
			await env.GEIST.put(`oauth_state_${state}`, "valid", { expirationTtl: 300 });
			
			const authUrl = await (client as any).getAuthorizationUrl({
				state,
				handle: url.searchParams.get('handle') || undefined,
			});
			
			return Response.redirect(authUrl, 302);
		} catch (error) {
			console.error("OAuth login error:", error);
			return new Response(JSON.stringify({ error: "OAuth login failed" }), {
				status: 500,
				headers: { "Content-Type": "application/json" },
			});
		}
	});

	// OAuth callback endpoint
	router.get("/api/auth/bluesky/callback", async (request: Request, env: any) => {
		try {
			const url = new URL(request.url);
			const code = url.searchParams.get('code');
			const state = url.searchParams.get('state');
			const error = url.searchParams.get('error');
			
			if (error) {
				throw new Error(`OAuth error: ${error}`);
			}
			
			if (!code || !state) {
				throw new Error("Missing code or state parameter");
			}
			
			// Validate state
			const storedState = await env.GEIST.get(`oauth_state_${state}`);
			if (!storedState) {
				throw new Error("Invalid or expired state");
			}
			
			// Clean up state
			await env.GEIST.delete(`oauth_state_${state}`);
			
			const client = await getOAuthClient(env);
			const { session } = await (client as any).exchangeCodeForToken(code);
			
			// Store the session for the user
			const sessionId = crypto.randomUUID();
			await env.GEIST.put(`bluesky_session_${sessionId}`, JSON.stringify({
				did: session.did,
				handle: session.handle,
				accessToken: session.accessToken,
				refreshToken: session.refreshToken,
				createdAt: Date.now(),
			}), { expirationTtl: 86400 }); // 24 hours
			
			// Redirect to frontend with session ID
			const baseUrl = getBaseUrl(env);
			const redirectUrl = new URL(baseUrl);
			redirectUrl.searchParams.set('bluesky_session', sessionId);
			
			return Response.redirect(redirectUrl.toString(), 302);
		} catch (error) {
			console.error("OAuth callback error:", error);
			const baseUrl = getBaseUrl(env);
			const redirectUrl = new URL(baseUrl);
			redirectUrl.searchParams.set('error', 'oauth_failed');
			return Response.redirect(redirectUrl.toString(), 302);
		}
	});

	// OAuth session verification endpoint
	router.post("/api/auth/bluesky/verify", async (request: Request, env: any) => {
		try {
			const requestBody = await request.json() as { sessionId?: string };
			const { sessionId } = requestBody;
			
			if (!sessionId) {
				throw new Error("Session ID is required");
			}
			
			const sessionData = await env.GEIST.get(`bluesky_session_${sessionId}`);
			
			if (!sessionData) {
				throw new Error("Invalid or expired session");
			}
			
			const session = JSON.parse(sessionData);
			
			// Generate JWT for the authenticated user
			const policyDO = await getPolicyDO(request, env);
			const policies = await policyDO.getAllPolicies();
			const jwtSecret = await env.GEIST.get("GEIST_JWT_SECRET");
			
			const jwt = await authorizeJWT(
				policies,
				{
					subject: session.did,
				},
				jwtSecret,
			);
			
			return new Response(
				JSON.stringify({
					jwt,
					did: session.did,
					handle: session.handle,
				}),
				{
					headers: {
						"Content-Type": "application/json",
					},
				},
			);
		} catch (error) {
			console.error("Bluesky verify error:", error);
			return new Response(JSON.stringify({ error: "Verification failed" }), {
				status: 401,
				headers: { "Content-Type": "application/json" },
			});
		}
	});

	// OAuth client metadata endpoint
	router.get("/api/oauth/client-metadata.json", async (request: Request, env: any) => {
		try {
			const clientMetadata = getClientMetadata(env);
			
			return new Response(JSON.stringify(clientMetadata), {
				headers: {
					"Content-Type": "application/json",
					"Cache-Control": "public, max-age=3600"
				},
			});
		} catch (error) {
			console.error("Client metadata error:", error);
			return new Response(JSON.stringify({ error: "Failed to get client metadata" }), {
				status: 500,
				headers: { "Content-Type": "application/json" },
			});
		}
	});

	// OAuth JWKS endpoint
	router.get("/api/oauth/jwks.json", async (request: Request, env: any) => {
		try {
			const privateKey = await getPrivateKey(env);
			
			// Create public key from private key (remove 'd' parameter)
			const publicKey = { ...privateKey };
			delete publicKey.d;
			
			const jwks = {
				keys: [publicKey]
			};
			
			return new Response(JSON.stringify(jwks), {
				headers: {
					"Content-Type": "application/json",
					"Cache-Control": "public, max-age=3600"
				},
			});
		} catch (error) {
			console.error("JWKS error:", error);
			return new Response(JSON.stringify({ error: "Failed to get JWKS" }), {
				status: 500,
				headers: { "Content-Type": "application/json" },
			});
		}
	});
};