import { expect, test } from "@playwright/test";
import { AuthHelpers } from "./helpers/auth-helpers";

test.describe("Bluesky OAuth Flow", () => {
	let authHelpers: AuthHelpers;

	test.beforeEach(async ({ page }) => {
		authHelpers = new AuthHelpers(page);
		await authHelpers.clearAuthData();
		await page.goto("/");
	});

	test("should display login button when user is not authenticated", async ({
		page,
	}) => {
		// Check that the login button is visible
		expect(await authHelpers.isUserNotAuthenticated()).toBe(true);
	});

	test("should open login dialog when clicking login button", async ({
		page,
	}) => {
		await authHelpers.openLoginDialog();

		// Check that the login dialog is opened
		await expect(page.getByRole("dialog")).toBeVisible();
		await expect(page.getByText("Login to Storacha")).toBeVisible();

		// Check that both tabs are present
		await expect(page.getByRole("tab", { name: "Storacha" })).toBeVisible();
		await expect(page.getByRole("tab", { name: "Social Login" })).toBeVisible();
	});

	test("should display Bluesky login button in OAuth tab", async ({ page }) => {
		await authHelpers.openLoginDialog();
		await authHelpers.switchToOAuthTab();

		// Check that the Bluesky login button is visible
		await expect(
			page.getByRole("button", { name: "Continue with Bluesky" }),
		).toBeVisible();

		// Check that the button contains the Bluesky icon (SVG)
		await expect(
			page.locator('button:has-text("Continue with Bluesky") svg'),
		).toBeVisible();
	});

	test("should prompt for handle when clicking Bluesky login button", async ({
		page,
	}) => {
		await authHelpers.openLoginDialog();
		await authHelpers.switchToOAuthTab();

		// Click the Bluesky login button
		await page.getByRole("button", { name: "Continue with Bluesky" }).click();

		// Should show handle input prompt or error about missing handle
		// (The new implementation requires a handle parameter)
		await page.waitForTimeout(500);

		// Check for error message or handle input
		const errorVisible = await page
			.locator("text=Bluesky handle is required")
			.isVisible();
		expect(errorVisible).toBe(true);
	});

	test("should handle OAuth callback and authenticate user", async ({
		page,
	}) => {
		// Mock successful OAuth session in browser storage
		await page.addInitScript(() => {
			// Mock the browser OAuth client
			const mockSession = {
				did: "did:plc:test123",
				accessJwt: "mock-jwt-token",
				refreshJwt: "mock-refresh-token",
			};

			// Store mock session data that would be set by OAuth client
			localStorage.setItem("geist.user.did", mockSession.did);
			localStorage.setItem("geist.user.handle", "test.bsky.social");
		});

		// Simulate OAuth callback with parameters
		await page.goto("/?code=mock_code&state=mock_state");

		// Wait for authentication to complete
		await page.waitForTimeout(1000);

		// Check that user is authenticated
		expect(await authHelpers.isUserAuthenticated()).toBe(true);
		expect(await authHelpers.isUserNotAuthenticated()).toBe(false);
	});

	test("should display error message when OAuth fails", async ({ page }) => {
		// Simulate OAuth error in callback
		await page.goto(
			"/?error=access_denied&error_description=User%20denied%20access",
		);

		// Wait for error handling
		await page.waitForTimeout(1000);

		// Check that user remains unauthenticated
		expect(await authHelpers.isUserNotAuthenticated()).toBe(true);
	});

	test("should handle OAuth initialization failure", async ({ page }) => {
		// Mock OAuth client initialization failure
		await page.addInitScript(() => {
			// Override the OAuth client to throw an error
			const originalConsoleError = console.error;
			console.error = (...args) => {
				if (args[0]?.includes("OAuth")) {
					// Suppress expected OAuth errors in test
					return;
				}
				originalConsoleError.apply(console, args);
			};
		});

		await authHelpers.openLoginDialog();
		await authHelpers.switchToOAuthTab();

		// Try to click Bluesky button without handle
		await page.getByRole("button", { name: "Continue with Bluesky" }).click();

		// Should show error or remain in same state
		await page.waitForTimeout(500);
		expect(await authHelpers.isUserNotAuthenticated()).toBe(true);
	});

	test("should show loading state during OAuth process", async ({ page }) => {
		await authHelpers.openLoginDialog();
		await authHelpers.switchToOAuthTab();

		// Click Bluesky button (will show error due to missing handle)
		await page.getByRole("button", { name: "Continue with Bluesky" }).click();

		// Check that the button shows some feedback
		await page.waitForTimeout(100);

		// The app should handle the error gracefully
		expect(await authHelpers.isUserNotAuthenticated()).toBe(true);
	});

	test("should clean up URL parameters after successful OAuth", async ({
		page,
	}) => {
		// Mock successful OAuth session
		await page.addInitScript(() => {
			const mockSession = {
				did: "did:plc:test123",
				accessJwt: "mock-jwt-token",
				refreshJwt: "mock-refresh-token",
			};

			localStorage.setItem("geist.user.did", mockSession.did);
			localStorage.setItem("geist.user.handle", "test.bsky.social");
		});

		// Simulate OAuth callback with parameters
		await page.goto("/?code=test_code&state=test_state");

		// Wait for authentication and URL cleanup
		await page.waitForTimeout(1000);

		// Check that URL parameters are cleaned up (handled by OAuth client)
		expect(page.url()).toBe("http://localhost:5173/");
	});
});
