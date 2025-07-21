import { JoseKey } from "@atproto/jwk-jose";
import { WebcryptoKey } from "@atproto/jwk-webcrypto";
import {
	type InternalStateData,
	type Key,
	OAuthClient,
	type OAuthSession,
	type Session,
} from "@atproto/oauth-client-browser";

// Extend window object for OAuth locks
declare global {
	interface Window {
		_oauthLocks?: Map<string, Promise<any>>;
	}
}

interface BlueskyAuthResult {
	did: string;
	handle: string;
	accessToken: string;
	refreshToken?: string;
}

interface StoredSession {
	did: string;
	handle: string;
	accessToken: string;
	refreshToken?: string;
	expiresAt: number;
}

class BlueskyOAuthManager {
	private client: OAuthClient | null = null;
	private currentSession: OAuthSession | null = null;

	private get clientMetadata() {
		const origin = window.location.origin;
		// Bluesky OAuth requires non-loopback URLs for production
		const isLocalhost =
			origin.includes("localhost") || origin.includes("127.0.0.1");
		const baseUrl = isLocalhost ? "https://tunnel.geist.network/" : origin;

		return {
			client_id: `https://tunnel.geist.network/client-metadata.json`,
			client_name: "Geist Filecoin",
			client_uri: baseUrl,
			redirect_uris: ["https://tunnel.geist.network/auth/callback"],
			grant_types: ["authorization_code", "refresh_token"],
			response_types: ["code"],
			scope: "atproto transition:generic",
			application_type: "web",
			token_endpoint_auth_method: "none",
			require_pushed_authorization_requests: false,
			dpop_bound_access_tokens: true,
			dpop_signing_alg_values_supported: ["ES256", "RS256"],
		};
	}

	async initialize(): Promise<void> {
		if (this.client) return;

		try {
			this.client = new OAuthClient({
				clientMetadata: this.clientMetadata,
				handleResolver: {
					resolve: async (handle: string) => {
						const reqUrl = `https://bsky.social/xrpc/com.atproto.identity.resolveHandle?handle=${encodeURIComponent(handle)}`;
						console.log("resolve", reqUrl);
						const response = await fetch(reqUrl);

						if (!response.ok) {
							throw new Error(`Failed to resolve handle: ${response.status}`);
						}

						const result = (await response.json()) as { did: string };
						return result.did;
					},
				},
				runtimeImplementation: {
					// A runtime specific implementation of the crypto operations needed by the
					// OAuth client. See "@atproto/oauth-client-browser" for a browser specific
					// implementation. The following example is suitable for use in NodeJS.
					async createKey(algs: string[]): Promise<Key> {
						// algs is an ordered array of preferred algorithms (e.g. ['RS256', 'ES256'])
						// Use WebcryptoKey which provides the required .algorithms getter
						//   const algsList = algs && algs.length > 0 ? algs : ['ES256', 'RS256'];
						//   // The WebcryptoKey.generate expects (algs: string[], kid?: string, options?: GenerateKeyPairOptions)
						//   // We want to pass { extractable: false } as the third argument
						//   const key = await WebcryptoKey.generate(algsList, undefined, { extractable: false });
						//   return key;

						return JoseKey.generate(algs);
					},

					getRandomValues(
						length: number,
					): Uint8Array | PromiseLike<Uint8Array> {
						return crypto.getRandomValues(new Uint8Array(length));
					},

					async digest(
						bytes: Uint8Array,
						algorithm: { name: string },
					): Promise<Uint8Array> {
						// sha256 is required. Unsupported algorithms should throw an error.

						if (algorithm.name.startsWith("sha")) {
							const subtleAlgo = `SHA-${algorithm.name.slice(3)}`;
							const buffer = await crypto.subtle.digest(subtleAlgo, bytes);
							return new Uint8Array(buffer);
						}

						throw new TypeError(`Unsupported algorithm: ${algorithm.name}`);
					},

					requestLock: <T>(
						name: string,
						fn: () => T | PromiseLike<T>,
					): Promise<T> => {
						// Simple in-memory lock implementation
						if (!window._oauthLocks) {
							window._oauthLocks = new Map();
						}

						const locks = window._oauthLocks;
						const current = locks.get(name) || Promise.resolve();
						const next = current
							.then(fn)
							.catch(() => {})
							.finally(() => {
								if (locks.get(name) === next) locks.delete(name);
							});

						locks.set(name, next);
						return next;
					},
				},

				stateStore: {
					// A store for saving state data while the user is being redirected to the
					// authorization server.

					async set(
						key: string,
						internalState: InternalStateData,
					): Promise<void> {
						sessionStorage.setItem(
							`oauth_state_${key}`,
							JSON.stringify(internalState),
						);
					},
					async get(key: string): Promise<InternalStateData | undefined> {
						const stored = sessionStorage.getItem(`oauth_state_${key}`);
						if (stored) {
							const storedState = JSON.parse(stored);

							console.log("jwk", storedState);
							const key = await JoseKey.fromJWK(storedState.dpopKey.jwk);
							console.log("key", key);
							return {
								...storedState,
								dpopKey: key,
							};
						}
					},
					async del(key: string): Promise<void> {
						sessionStorage.removeItem(`oauth_state_${key}`);
					},
				},

				sessionStore: {
					// A store for saving session data.

					async set(sub: string, session: Session): Promise<void> {
						localStorage.setItem(
							`oauth_session_${sub}`,
							JSON.stringify(session),
						);
					},
					async get(sub: string): Promise<Session | undefined> {
						const stored = localStorage.getItem(`oauth_session_${sub}`);
						return stored ? JSON.parse(stored) : undefined;
					},
					async del(sub: string): Promise<void> {
						localStorage.removeItem(`oauth_session_${sub}`);
					},
				},

				// keyset is not needed for browser clients using PKCE
			});

			// Try to restore session from storage
			await this.restoreSession();
		} catch (error) {
			console.error("Failed to initialize OAuth client:", error);
			throw error;
		}
	}

	private async restoreSession(): Promise<void> {
		if (!this.client) return;

		try {
			const stored = this.getStoredSession();
			if (!stored) return;

			// Check if session is expired
			if (Date.now() > stored.expiresAt) {
				this.clearSession();
				return;
			}

			// Try to restore the session with the client
			this.currentSession = await this.client.restore(stored.did);
		} catch (error) {
			console.error("Failed to restore session:", error);
			this.clearSession();
		}
	}

	async login(handle?: string): Promise<void> {
		console.log("BlueskyOAuthManager.login called with handle:", handle);
		await this.initialize();

		if (!this.client) {
			throw new Error("OAuth client not initialized");
		}

		try {
			const identity = "debuggingfuture.com";
			// If no handle provided, use bsky.social as default server
			// const identity = handle || 'bsky.social';
			console.log("Using identity for OAuth:", identity);
			const authUrl = await this.client.authorize(identity);

			// Store current location to return to after auth
			sessionStorage.setItem("bluesky_redirect_url", window.location.href);

			// Redirect to authorization URL
			window.location.href = authUrl;
		} catch (error) {
			console.error("OAuth login failed:", error);
			throw error;
		}
	}

	async handleCallback(
		params: URLSearchParams,
	): Promise<BlueskyAuthResult | null> {
		await this.initialize();

		if (!this.client) {
			throw new Error("OAuth client not initialized");
		}

		try {
			// Check if this is an OAuth callback
			if (!params.get("code") && !params.get("error")) {
				return null; // Not a callback URL
			}

			if (params.get("error")) {
				throw new Error(`OAuth error: ${params.get("error")}`);
			}

			// Process the callback
			const { session } = await this.client.callback(params);
			this.currentSession = session;

			// Extract session info
			const authResult: BlueskyAuthResult = {
				did: session.did,
				handle: session.handle || "",
				accessToken: session.accessJwt,
				refreshToken: session.refreshJwt,
			};

			// Store in localStorage for persistence
			const storedSession: StoredSession = {
				...authResult,
				expiresAt: Date.now() + 24 * 60 * 60 * 1000, // 24 hours
			};
			localStorage.setItem("bluesky_session", JSON.stringify(storedSession));

			// Clean up URL
			const redirectUrl = sessionStorage.getItem("bluesky_redirect_url") || "/";
			sessionStorage.removeItem("bluesky_redirect_url");

			window.history.replaceState({}, document.title, redirectUrl);

			return authResult;
		} catch (error) {
			console.error("OAuth callback failed:", error);
			throw error;
		}
	}

	getStoredSession(): StoredSession | null {
		try {
			const stored = localStorage.getItem("bluesky_session");
			if (!stored) return null;

			const session: StoredSession = JSON.parse(stored);

			// Check if session is expired
			if (session.expiresAt && Date.now() > session.expiresAt) {
				this.clearSession();
				return null;
			}

			return session;
		} catch (error) {
			console.error("Failed to get stored session:", error);
			return null;
		}
	}

	getCurrentSession(): BlueskyAuthResult | null {
		const stored = this.getStoredSession();
		if (!stored) return null;

		return {
			did: stored.did,
			handle: stored.handle,
			accessToken: stored.accessToken,
			refreshToken: stored.refreshToken,
		};
	}

	clearSession(): void {
		localStorage.removeItem("bluesky_session");
		this.currentSession = null;
	}

	async refreshToken(): Promise<BlueskyAuthResult | null> {
		if (!this.currentSession) {
			const stored = this.getStoredSession();
			if (!stored) return null;

			await this.initialize();
			if (!this.currentSession) return null;
		}

		try {
			// The OAuth client handles token refresh automatically
			// We just need to ensure the session is still valid
			const authResult: BlueskyAuthResult = {
				did: this.currentSession.did,
				handle: this.currentSession.handle || "",
				accessToken: this.currentSession.accessJwt,
				refreshToken: this.currentSession.refreshJwt,
			};

			// Update stored session
			const storedSession: StoredSession = {
				...authResult,
				expiresAt: Date.now() + 24 * 60 * 60 * 1000, // 24 hours
			};
			localStorage.setItem("bluesky_session", JSON.stringify(storedSession));

			return authResult;
		} catch (error) {
			console.error("Token refresh failed:", error);
			this.clearSession();
			return null;
		}
	}

	async makeAuthenticatedRequest(
		url: string,
		options: RequestInit = {},
	): Promise<Response> {
		if (!this.currentSession) {
			const session = await this.refreshToken();
			if (!session) {
				throw new Error("No valid session available");
			}
		}

		const headers = new Headers(options.headers);
		headers.set("Authorization", `Bearer ${this.currentSession?.accessJwt}`);

		return fetch(url, {
			...options,
			headers,
		});
	}
}

// Singleton instance
export const blueskyOAuth = new BlueskyOAuthManager();

// Helper functions for React components
export const loginWithBluesky = (handle?: string) => {
	console.log("loginWithBluesky wrapper called with handle:", handle);
	return blueskyOAuth.login(handle);
};
export const handleBlueskyCallback = (params: URLSearchParams) =>
	blueskyOAuth.handleCallback(params);
export const getBlueskySession = () => blueskyOAuth.getCurrentSession();
export const clearBlueskySession = () => blueskyOAuth.clearSession();
export const refreshBlueskyToken = () => blueskyOAuth.refreshToken();
export const makeBlueskyRequest = (url: string, options?: RequestInit) =>
	blueskyOAuth.makeAuthenticatedRequest(url, options);
