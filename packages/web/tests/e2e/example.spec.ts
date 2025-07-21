import { expect, test } from "@playwright/test";

test.describe("Example Tests", () => {
	test("should load the homepage", async ({ page }) => {
		await page.goto("/");

		// Check that the page loads successfully
		expect(page.url()).toBe("http://localhost:5173/");

		// Check for basic elements
		await expect(page.locator("body")).toBeVisible();
	});

	test("should have a login button when not authenticated", async ({
		page,
	}) => {
		await page.goto("/");

		// Check that login button is present
		await expect(page.getByRole("button", { name: "Login" })).toBeVisible();
	});

	test("should open login dialog", async ({ page }) => {
		await page.goto("/");

		// Click login button
		await page.getByRole("button", { name: "Login" }).click();

		// Check that dialog opens
		await expect(page.getByRole("dialog")).toBeVisible();
		await expect(page.getByText("Login to Storacha")).toBeVisible();
	});
});
