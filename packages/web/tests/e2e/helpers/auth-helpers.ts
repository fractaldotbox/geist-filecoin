import type { Page } from "@playwright/test";

export class AuthHelpers {
	constructor(private page: Page) {}

	/**
	 * Opens the login dialog
	 */
	async openLoginDialog() {
		await this.page.getByRole("button", { name: "Login" }).click();
	}

	/**
	 * Switches to the OAuth tab in the login dialog
	 */
	async switchToOAuthTab() {
		await this.page.getByRole("tab", { name: "Social Login" }).click();
	}

	/**
	 * Clicks the Bluesky login button
	 */
	async clickBlueskyLogin() {
		await this.page
			.getByRole("button", { name: "Continue with Bluesky" })
			.click();
	}

	/**
	 * Mocks a successful OAuth session in browser storage
	 */
	async mockSuccessfulOAuthSession(
		options: {
			accessJwt?: string;
			refreshJwt?: string;
			did?: string;
			handle?: string;
		} = {},
	) {
		const {
			accessJwt = "mock-jwt-token",
			refreshJwt = "mock-refresh-token",
			did = "did:plc:test123",
			handle = "test.bsky.social",
		} = options;

		await this.page.addInitScript(
			(sessionData) => {
				// Mock the OAuth session in localStorage
				localStorage.setItem("geist.user.did", sessionData.did);
				localStorage.setItem("geist.user.handle", sessionData.handle);

				// Store OAuth tokens that would be handled by the OAuth client
				// Note: In reality, these are handled by @atproto/oauth-client-browser internally
			},
			{ accessJwt, refreshJwt, did, handle },
		);
	}

	/**
	 * Mocks a failed OAuth process
	 */
	async mockFailedOAuthSession(error = "OAuth failed") {
		await this.page.addInitScript((errorMessage) => {
			// Mock OAuth error state
			console.error("OAuth Mock Error:", errorMessage);
			// Clear any existing auth data
			localStorage.removeItem("geist.user.did");
			localStorage.removeItem("geist.user.handle");
		}, error);
	}

	/**
	 * Mocks browser OAuth client to avoid actual Bluesky redirect
	 */
	async mockOAuthClient() {
		await this.page.addInitScript(() => {
			// Mock the browser OAuth client to prevent actual redirect
			window.mockOAuthClient = {
				initialized: false,
				session: null,
			};
		});
	}

	/**
	 * Simulates a complete OAuth flow with browser OAuth client
	 */
	async completeOAuthFlow(options = {}) {
		await this.mockSuccessfulOAuthSession(options);
		// Simulate OAuth callback URL
		await this.page.goto("/?code=mock_code&state=mock_state");
		await this.page.waitForTimeout(1000);
	}

	/**
	 * Checks if user is authenticated (user menu is visible)
	 */
	async isUserAuthenticated() {
		return await this.page
			.locator('button:has([role="img"])')
			.first()
			.isVisible();
	}

	/**
	 * Checks if user is not authenticated (login button is visible)
	 */
	async isUserNotAuthenticated() {
		return await this.page.getByRole("button", { name: "Login" }).isVisible();
	}

	/**
	 * Waits for authentication to complete
	 */
	async waitForAuthenticationComplete() {
		await this.page.waitForFunction(
			() => {
				return document.querySelector('button:has([role="img"])') !== null;
			},
			{ timeout: 5000 },
		);
	}

	/**
	 * Clears all authentication data including OAuth client state
	 */
	async clearAuthData() {
		await this.page.evaluate(() => {
			// Clear localStorage auth data
			localStorage.removeItem("geist.user.did");
			localStorage.removeItem("geist.jwt");
			localStorage.removeItem("geist.user.handle");

			// Clear OAuth client storage (prefix used by @atproto/oauth-client-browser)
			for (let i = localStorage.length - 1; i >= 0; i--) {
				const key = localStorage.key(i);
				if (key?.startsWith("@atproto-oauth-")) {
					localStorage.removeItem(key);
				}
			}

			// Clear sessionStorage as well
			sessionStorage.clear();
		});
	}
}
