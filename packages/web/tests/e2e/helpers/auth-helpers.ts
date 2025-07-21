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
	 * Mocks a successful OAuth verification response
	 */
	async mockSuccessfulOAuthVerification(
		options: {
			jwt?: string;
			did?: string;
			handle?: string;
		} = {},
	) {
		const {
			jwt = "mock-jwt-token",
			did = "did:plc:test123",
			handle = "test.bsky.social",
		} = options;

		await this.page.route("**/api/auth/bluesky/verify", async (route) => {
			await route.fulfill({
				status: 200,
				contentType: "application/json",
				body: JSON.stringify({ jwt, did, handle }),
			});
		});
	}

	/**
	 * Mocks a failed OAuth verification response
	 */
	async mockFailedOAuthVerification(error = "Verification failed") {
		await this.page.route("**/api/auth/bluesky/verify", async (route) => {
			await route.fulfill({
				status: 401,
				contentType: "application/json",
				body: JSON.stringify({ error }),
			});
		});
	}

	/**
	 * Mocks the OAuth login redirect
	 */
	async mockOAuthRedirect(
		redirectUrl = "https://bsky.social/oauth/authorize?client_id=test&redirect_uri=test&state=test",
	) {
		await this.page.route("**/api/auth/bluesky/login*", async (route) => {
			await route.fulfill({
				status: 302,
				headers: {
					Location: redirectUrl,
				},
			});
		});
	}

	/**
	 * Simulates a complete OAuth flow
	 */
	async completeOAuthFlow(sessionId = "test-session-id") {
		await this.mockSuccessfulOAuthVerification();
		await this.page.goto(`/?bluesky_session=${sessionId}`);
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
	 * Clears localStorage authentication data
	 */
	async clearAuthData() {
		await this.page.evaluate(() => {
			localStorage.removeItem("geist.user.did");
			localStorage.removeItem("geist.jwt");
			localStorage.removeItem("geist.user.handle");
		});
	}
}
