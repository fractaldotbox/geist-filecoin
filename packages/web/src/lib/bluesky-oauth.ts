import {
	BrowserOAuthClient,
	type OAuthSession,
	XrpcHandleResolver,
} from "@atproto/oauth-client-browser";

export const HOST = process.env.HOST || "https://tunnel.geist.network/";

class BlueskyOAuthManager {
	private client: BrowserOAuthClient | null = null;
	private currentSession: OAuthSession | null = null;

	private get clientMetadata() {
		const origin = window.location.origin;
		// Bluesky OAuth requires non-loopback URLs for production
		const isLocalhost =
			origin.includes("localhost") || origin.includes("127.0.0.1");
		const baseUrl = isLocalhost ? HOST : origin;

		return {
			client_id: `${HOST}/client-metadata.json`,
			client_name: "Geist Filecoin",
			client_uri: baseUrl,
			redirect_uris: [`${HOST}/auth/callback`],
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
		console.log("initialize");

		try {
			this.client = new BrowserOAuthClient({
				clientMetadata: this.clientMetadata,
				handleResolver: new XrpcHandleResolver("https://bsky.social"),
			});

			// Try to initialize and restore any existing session
			await this.restoreSession();
		} catch (error) {
			console.error("Failed to initialize OAuth client:", error);
			throw error;
		}
	}

	private async restoreSession(): Promise<void> {
		if (!this.client) return;

		try {
			const result = await this.client.init();
			if (result) {
				this.currentSession = result.session;
				console.log("Session restored:", result);
			}
		} catch (error) {
			console.error("Failed to restore session:", error);
			this.currentSession = null;
		}
	}

	async login(handle?: string): Promise<void> {
		await this.initialize();

		if (!this.client) {
			throw new Error("OAuth client not initialized");
		}

		try {
			const identity = handle || "debuggingfuture.com";
			console.log("Using identity for OAuth:", identity);

			// Store current location to return to after auth
			sessionStorage.setItem("bluesky_redirect_url", window.location.href);

			// Use BrowserOAuthClient's signInRedirect method
			await this.client.signInRedirect(identity);
		} catch (error) {
			console.error("OAuth login failed:", error);
			throw error;
		}
	}

	async handleCallback(params: URLSearchParams): Promise<OAuthSession | null> {
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

			// BrowserOAuthClient handles callback automatically during init()
			// Just try to get the current session after callback
			const result = await this.client.init();

			console.log("result at callback", result);
			if (result) {
				this.currentSession = result.session;

				// Clean up URL
				const redirectUrl =
					sessionStorage.getItem("bluesky_redirect_url") || "/";
				sessionStorage.removeItem("bluesky_redirect_url");
				window.history.replaceState({}, document.title, redirectUrl);

				return this.currentSession;
			}

			return null;
		} catch (error) {
			console.error("OAuth callback failed:", error);
			throw error;
		}
	}

	async getCurrentSession(): Promise<OAuthSession | null> {
		if (!this.client) {
			await this.initialize();
		}

		// Try to restore session if not already loaded
		try {
			if (!this.currentSession) {
				const result = await this.client?.init();

				this.currentSession = result?.session || null;
			}

			return this.currentSession;
		} catch (error) {
			console.error("Failed to get current session:", error);
		}

		return null;
	}

	async clearSession(): Promise<void> {
		if (this.client && this.currentSession) {
			try {
				await this.client.revoke(this.currentSession.did);
			} catch (error) {
				console.error("Failed to revoke session:", error);
			}
		}
		this.currentSession = null;
	}

	async refreshToken(): Promise<OAuthSession | null> {
		if (!this.client) {
			await this.initialize();
		}

		try {
			// BrowserOAuthClient handles token refresh automatically
			// Just get the current session which will be refreshed if needed
			return await this.getCurrentSession();
		} catch (error) {
			console.error("Token refresh failed:", error);
			await this.clearSession();
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
