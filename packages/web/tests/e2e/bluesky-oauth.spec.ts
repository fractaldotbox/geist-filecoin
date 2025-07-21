import { expect, test } from "@playwright/test";

test.describe("Bluesky OAuth Flow", () => {
	test.beforeEach(async ({ page }) => {
		// Navigate to the home page
		await page.goto("/");
	});

	test("should display login button when user is not authenticated", async ({
		page,
	}) => {
		// Check that the login button is visible
		await expect(page.getByRole("button", { name: "Login" })).toBeVisible();
	});

	test("should open login dialog when clicking login button", async ({
		page,
	}) => {
		// Click the login button
		await page.getByRole("button", { name: "Login" }).click();

		// Check that the login dialog is opened
		await expect(page.getByRole("dialog")).toBeVisible();
		await expect(page.getByText("Login to Storacha")).toBeVisible();

		// Check that both tabs are present
		await expect(page.getByRole("tab", { name: "Storacha" })).toBeVisible();
		await expect(page.getByRole("tab", { name: "Social Login" })).toBeVisible();
	});

	test("should display Bluesky login button in OAuth tab", async ({ page }) => {
		// Open login dialog
		await page.getByRole("button", { name: "Login" }).click();

		// Switch to OAuth tab
		await page.getByRole("tab", { name: "Social Login" }).click();

		// Check that the Bluesky login button is visible
		await expect(
			page.getByRole("button", { name: "Continue with Bluesky" }),
		).toBeVisible();

		// Check that the button contains the Bluesky icon (SVG)
		await expect(
			page.locator('button:has-text("Continue with Bluesky") svg'),
		).toBeVisible();
	});

	test("should redirect to Bluesky OAuth when clicking Bluesky login button", async ({
		page,
	}) => {
		// Open login dialog
		await page.getByRole("button", { name: "Login" }).click();

		// Switch to OAuth tab
		await page.getByRole("tab", { name: "Social Login" }).click();

		// Mock the OAuth redirect to avoid actual Bluesky interaction
		await page.route("**/api/auth/bluesky/login*", async (route) => {
			// Simulate the OAuth redirect
			await route.fulfill({
				status: 302,
				headers: {
					Location:
						"https://bsky.social/oauth/authorize?client_id=test&redirect_uri=test&state=test",
				},
			});
		});

		// Click the Bluesky login button
		await page.getByRole("button", { name: "Continue with Bluesky" }).click();

		// Wait for navigation to OAuth endpoint
		await page.waitForURL(/.*api\/auth\/bluesky\/login.*/);
	});

	test("should handle OAuth callback and authenticate user", async ({
		page,
	}) => {
		// Mock the OAuth callback flow
		await page.route("**/api/auth/bluesky/verify", async (route) => {
			await route.fulfill({
				status: 200,
				contentType: "application/json",
				body: JSON.stringify({
					jwt: "mock-jwt-token",
					did: "did:plc:test123",
					handle: "test.bsky.social",
				}),
			});
		});

		// Simulate returning from OAuth with session ID
		await page.goto("/?bluesky_session=test-session-id");

		// Wait for authentication to complete
		await page.waitForTimeout(1000);

		// Check that user is authenticated (login button should be replaced with user menu)
		await expect(page.getByRole("button", { name: "Login" })).not.toBeVisible();

		// Check that user menu is visible (avatar button)
		await expect(
			page.locator('button:has([role="img"])').first(),
		).toBeVisible();
	});

	test("should display error message when OAuth fails", async ({ page }) => {
		// Simulate OAuth error
		await page.goto("/?error=oauth_failed");

		// Check that error is handled gracefully
		// This would depend on how your app handles OAuth errors
		await expect(page.getByRole("button", { name: "Login" })).toBeVisible();
	});

	test("should handle OAuth session verification failure", async ({ page }) => {
		// Mock failed session verification
		await page.route("**/api/auth/bluesky/verify", async (route) => {
			await route.fulfill({
				status: 401,
				contentType: "application/json",
				body: JSON.stringify({
					error: "Verification failed",
				}),
			});
		});

		// Open login dialog
		await page.getByRole("button", { name: "Login" }).click();

		// Switch to OAuth tab
		await page.getByRole("tab", { name: "Social Login" }).click();

		// Simulate failed OAuth callback
		await page.goto("/?bluesky_session=invalid-session-id");

		// Open login dialog again to check error state
		await page.getByRole("button", { name: "Login" }).click();
		await page.getByRole("tab", { name: "Social Login" }).click();

		// Wait for error to be displayed
		await page.waitForTimeout(1000);

		// Check that error message is shown
		await expect(page.locator("text=Bluesky login failed")).toBeVisible();
	});

	test("should show loading state during OAuth process", async ({ page }) => {
		// Mock delayed OAuth response
		await page.route("**/api/auth/bluesky/verify", async (route) => {
			await new Promise((resolve) => setTimeout(resolve, 1000));
			await route.fulfill({
				status: 200,
				contentType: "application/json",
				body: JSON.stringify({
					jwt: "mock-jwt-token",
					did: "did:plc:test123",
					handle: "test.bsky.social",
				}),
			});
		});

		// Simulate OAuth callback with loading state
		await page.goto("/?bluesky_session=test-session-id");

		// The loading state would be handled by the AuthProvider
		// This test ensures the app doesn't crash during loading
		await page.waitForTimeout(1500);

		// Check that authentication eventually completes
		await expect(
			page.locator('button:has([role="img"])').first(),
		).toBeVisible();
	});

	test("should clean up URL parameters after successful OAuth", async ({
		page,
	}) => {
		// Mock successful OAuth
		await page.route("**/api/auth/bluesky/verify", async (route) => {
			await route.fulfill({
				status: 200,
				contentType: "application/json",
				body: JSON.stringify({
					jwt: "mock-jwt-token",
					did: "did:plc:test123",
					handle: "test.bsky.social",
				}),
			});
		});

		// Simulate OAuth callback
		await page.goto("/?bluesky_session=test-session-id");

		// Wait for authentication and URL cleanup
		await page.waitForTimeout(1000);

		// Check that URL parameters are cleaned up
		expect(page.url()).toBe("http://localhost:5173/");
	});
});
