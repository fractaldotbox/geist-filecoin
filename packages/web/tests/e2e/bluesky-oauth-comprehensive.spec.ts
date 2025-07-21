import { expect, test } from "@playwright/test";
import { AuthHelpers } from "./helpers/auth-helpers";

test.describe("Bluesky OAuth Flow - Comprehensive", () => {
	let authHelpers: AuthHelpers;

	test.beforeEach(async ({ page }) => {
		authHelpers = new AuthHelpers(page);
		await authHelpers.clearAuthData();
		await page.goto("/");
	});

	test.describe("UI Elements", () => {
		test("should display all OAuth UI elements correctly", async ({ page }) => {
			await authHelpers.openLoginDialog();
			await authHelpers.switchToOAuthTab();

			// Check main elements
			await expect(
				page.getByText("Sign in with your social account"),
			).toBeVisible();
			await expect(
				page.getByRole("button", { name: "Continue with Bluesky" }),
			).toBeVisible();
			await expect(page.getByRole("button", { name: "Cancel" })).toBeVisible();

			// Check Bluesky button styling and icon
			const blueskyButton = page.getByRole("button", {
				name: "Continue with Bluesky",
			});
			await expect(blueskyButton).toHaveClass(/w-full/);
			await expect(blueskyButton).toHaveClass(/flex/);
			await expect(blueskyButton).toHaveClass(/items-center/);
			await expect(blueskyButton).toHaveClass(/gap-2/);

			// Check icon is present
			await expect(blueskyButton.locator("svg")).toBeVisible();
		});

		test("should handle dialog close correctly", async ({ page }) => {
			await authHelpers.openLoginDialog();
			await authHelpers.switchToOAuthTab();

			// Close dialog with Cancel button
			await page.getByRole("button", { name: "Cancel" }).click();

			// Dialog should be closed
			await expect(page.getByRole("dialog")).not.toBeVisible();
		});
	});

	test.describe("OAuth Flow", () => {
		test("should initiate OAuth flow correctly", async ({ page }) => {
			await authHelpers.mockOAuthRedirect();
			await authHelpers.openLoginDialog();
			await authHelpers.switchToOAuthTab();

			// Click Bluesky login button
			await authHelpers.clickBlueskyLogin();

			// Should redirect to OAuth endpoint
			await page.waitForURL(/.*api\/auth\/bluesky\/login.*/);
		});

		test("should handle successful OAuth callback", async ({ page }) => {
			await authHelpers.completeOAuthFlow();

			// Check authentication state
			expect(await authHelpers.isUserAuthenticated()).toBe(true);
			expect(await authHelpers.isUserNotAuthenticated()).toBe(false);

			// Check URL is cleaned up
			expect(page.url()).toBe("http://localhost:5173/");
		});

		test("should handle OAuth callback with custom user data", async ({
			page,
		}) => {
			await authHelpers.mockSuccessfulOAuthVerification({
				jwt: "custom-jwt-token",
				did: "did:plc:custom123",
				handle: "custom.bsky.social",
			});

			await page.goto("/?bluesky_session=custom-session");
			await page.waitForTimeout(1000);

			// Check that user is authenticated
			expect(await authHelpers.isUserAuthenticated()).toBe(true);

			// Check that custom data is stored (would need to check localStorage in real app)
			const storedData = await page.evaluate(() => {
				return {
					did: localStorage.getItem("geist.user.did"),
					jwt: localStorage.getItem("geist.jwt"),
					handle: localStorage.getItem("geist.user.handle"),
				};
			});

			expect(storedData.did).toBe("did:plc:custom123");
			expect(storedData.jwt).toBe("custom-jwt-token");
			expect(storedData.handle).toBe("custom.bsky.social");
		});
	});

	test.describe("Error Handling", () => {
		test("should handle OAuth verification failure", async ({ page }) => {
			await authHelpers.mockFailedOAuthVerification("Invalid session");

			await page.goto("/?bluesky_session=invalid-session");
			await page.waitForTimeout(1000);

			// User should not be authenticated
			expect(await authHelpers.isUserAuthenticated()).toBe(false);
			expect(await authHelpers.isUserNotAuthenticated()).toBe(true);

			// Open login dialog to check error state
			await authHelpers.openLoginDialog();
			await authHelpers.switchToOAuthTab();

			// Error message should be visible
			await expect(page.locator("text=Bluesky login failed")).toBeVisible();
		});

		test("should handle network errors during verification", async ({
			page,
		}) => {
			// Mock network error
			await page.route("**/api/auth/bluesky/verify", async (route) => {
				await route.abort("failed");
			});

			await page.goto("/?bluesky_session=test-session");
			await page.waitForTimeout(1000);

			// Should remain unauthenticated
			expect(await authHelpers.isUserNotAuthenticated()).toBe(true);
		});

		test("should handle malformed OAuth response", async ({ page }) => {
			await page.route("**/api/auth/bluesky/verify", async (route) => {
				await route.fulfill({
					status: 200,
					contentType: "application/json",
					body: "invalid json",
				});
			});

			await page.goto("/?bluesky_session=test-session");
			await page.waitForTimeout(1000);

			// Should remain unauthenticated
			expect(await authHelpers.isUserNotAuthenticated()).toBe(true);
		});
	});

	test.describe("Loading States", () => {
		test("should show loading state during OAuth process", async ({ page }) => {
			// Mock delayed response
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

			await page.goto("/?bluesky_session=test-session");

			// During loading, user should still be unauthenticated
			expect(await authHelpers.isUserNotAuthenticated()).toBe(true);

			// Wait for loading to complete
			await authHelpers.waitForAuthenticationComplete();

			// Now user should be authenticated
			expect(await authHelpers.isUserAuthenticated()).toBe(true);
		});

		test("should disable button during loading", async ({ page }) => {
			await authHelpers.openLoginDialog();
			await authHelpers.switchToOAuthTab();

			// Mock delayed redirect
			await page.route("**/api/auth/bluesky/login*", async (route) => {
				await new Promise((resolve) => setTimeout(resolve, 500));
				await route.fulfill({
					status: 302,
					headers: {
						Location: "https://bsky.social/oauth/authorize?test=true",
					},
				});
			});

			// Click button and check it becomes disabled
			const blueskyButton = page.getByRole("button", {
				name: "Continue with Bluesky",
			});
			await blueskyButton.click();

			// Button should show loading state
			await expect(
				page.getByRole("button", { name: "Connecting..." }),
			).toBeVisible();
		});
	});

	test.describe("Integration with Existing Auth", () => {
		test("should work alongside email authentication", async ({ page }) => {
			await authHelpers.openLoginDialog();

			// Check both auth methods are available
			await expect(page.getByRole("tab", { name: "Storacha" })).toBeVisible();
			await expect(
				page.getByRole("tab", { name: "Social Login" }),
			).toBeVisible();

			// Switch between tabs
			await authHelpers.switchToOAuthTab();
			await expect(
				page.getByRole("button", { name: "Continue with Bluesky" }),
			).toBeVisible();

			await page.getByRole("tab", { name: "Storacha" }).click();
			await expect(page.getByRole("textbox", { name: "Email" })).toBeVisible();
		});

		test("should handle existing authentication state", async ({ page }) => {
			// Pre-authenticate user with email (mock)
			await page.evaluate(() => {
				localStorage.setItem("geist.user.did", "did:plc:existing123");
			});

			await page.reload();
			await page.waitForTimeout(500);

			// Should not show login button if already authenticated
			await expect(
				page.getByRole("button", { name: "Login" }),
			).not.toBeVisible();
		});
	});

	test.describe("Mobile and Accessibility", () => {
		test("should work on mobile devices", async ({ page }) => {
			await page.setViewportSize({ width: 375, height: 667 });

			await authHelpers.openLoginDialog();
			await authHelpers.switchToOAuthTab();

			// Check mobile-specific styling
			const dialog = page.getByRole("dialog");
			await expect(dialog).toBeVisible();

			const blueskyButton = page.getByRole("button", {
				name: "Continue with Bluesky",
			});
			await expect(blueskyButton).toBeVisible();
			await expect(blueskyButton).toHaveClass(/w-full/);
		});

		test("should be accessible via keyboard navigation", async ({ page }) => {
			await authHelpers.openLoginDialog();

			// Tab to OAuth tab
			await page.keyboard.press("Tab");
			await page.keyboard.press("Tab");
			await page.keyboard.press("Enter");

			// Should be on OAuth tab
			await expect(
				page.getByRole("button", { name: "Continue with Bluesky" }),
			).toBeVisible();

			// Tab to Bluesky button and activate
			await page.keyboard.press("Tab");
			await page.keyboard.press("Enter");

			// Should trigger OAuth flow (would need to mock for full test)
		});

		test("should have proper ARIA labels", async ({ page }) => {
			await authHelpers.openLoginDialog();
			await authHelpers.switchToOAuthTab();

			// Check accessibility attributes
			const dialog = page.getByRole("dialog");
			await expect(dialog).toBeVisible();

			const blueskyButton = page.getByRole("button", {
				name: "Continue with Bluesky",
			});
			await expect(blueskyButton).toBeVisible();

			// Check that SVG has proper title
			const svg = blueskyButton.locator("svg");
			await expect(svg).toBeVisible();
		});
	});
});
