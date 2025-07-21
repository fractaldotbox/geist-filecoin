import { expect, test } from "@playwright/test";

test.describe("Basic Playwright Setup", () => {
	test("should be able to navigate to a website", async ({ page }) => {
		await page.goto("https://vite.example.com");

		// Check that the page loads successfully
		await expect(page.locator("h1")).toContainText("Example Domain");
	});

	test("should be able to perform basic interactions", async ({ page }) => {
		await page.goto("https://vite.example.com");

		// Check that we can find elements
		const heading = page.locator("h1");
		await expect(heading).toBeVisible();

		// Check that the page has expected content
		await expect(page).toHaveTitle(/Example Domain/);
	});
});
