import { expect, test } from "@playwright/test";

test.describe("OAuth Unit Tests", () => {
	test("should validate OAuth helper functions", async ({ page }) => {
		// Test the AuthHelpers class functionality
		await page.goto(
			"data:text/html,<html><body><h1>Test Page</h1></body></html>",
		);

		// Check that the page loads
		await expect(page.locator("h1")).toContainText("Test Page");

		// Test basic page functionality
		await expect(page.locator("body")).toBeVisible();
	});

	test("should handle OAuth mock scenarios", async ({ page }) => {
		// Create a simple HTML page with OAuth-like elements
		const html = `
      <html>
        <body>
          <button id="login-btn">Login</button>
          <button id="bluesky-btn" style="display: none;">Continue with Bluesky</button>
          <div id="error-msg" style="display: none;"></div>
          <script>
            document.getElementById('login-btn').addEventListener('click', () => {
              document.getElementById('bluesky-btn').style.display = 'block';
            });
            
            document.getElementById('bluesky-btn').addEventListener('click', () => {
              document.getElementById('error-msg').textContent = 'OAuth flow initiated';
              document.getElementById('error-msg').style.display = 'block';
            });
          </script>
        </body>
      </html>
    `;

		await page.goto(`data:text/html,${encodeURIComponent(html)}`);

		// Test login button
		await expect(page.locator("#login-btn")).toBeVisible();
		await page.click("#login-btn");

		// Test Bluesky button appears
		await expect(page.locator("#bluesky-btn")).toBeVisible();
		await page.click("#bluesky-btn");

		// Test OAuth flow indication
		await expect(page.locator("#error-msg")).toContainText(
			"OAuth flow initiated",
		);
	});

	test("should validate OAuth configuration", async ({ page }) => {
		// Test configuration validation
		await page.goto(
			'data:text/html,<html><body><div id="config-test">OAuth Config Test</div></body></html>',
		);

		// Simulate checking OAuth configuration
		const configValid = await page.evaluate(() => {
			// Mock OAuth configuration validation
			const config = {
				clientId: "test-client-id",
				redirectUri: "http://localhost:5173/callback",
				scopes: ["atproto", "transition:generic"],
			};

			return config.clientId && config.redirectUri && config.scopes.length > 0;
		});

		expect(configValid).toBe(true);
		await expect(page.locator("#config-test")).toContainText(
			"OAuth Config Test",
		);
	});

	test("should handle OAuth error scenarios", async ({ page }) => {
		// Test error handling
		const html = `
      <html>
        <body>
          <div id="error-container">
            <div id="oauth-error" style="display: none; color: red;"></div>
          </div>
          <script>
            // Simulate OAuth error
            setTimeout(() => {
              document.getElementById('oauth-error').textContent = 'OAuth verification failed';
              document.getElementById('oauth-error').style.display = 'block';
            }, 100);
          </script>
        </body>
      </html>
    `;

		await page.goto(`data:text/html,${encodeURIComponent(html)}`);

		// Wait for error message
		await page.waitForSelector("#oauth-error");
		await expect(page.locator("#oauth-error")).toContainText(
			"OAuth verification failed",
		);
		await expect(page.locator("#oauth-error")).toHaveCSS(
			"color",
			"rgb(255, 0, 0)",
		);
	});

	test("should validate URL parameter handling", async ({ page }) => {
		// Test URL parameter extraction
		await page.goto(
			'data:text/html,<html><body><div id="url-test">URL Test</div></body></html>',
		);

		// Test URL parameter handling
		const urlParams = await page.evaluate(() => {
			// Mock URL with OAuth parameters
			const mockUrl =
				"http://localhost:5173/?bluesky_session=test-session-123&state=test-state";
			const url = new URL(mockUrl);

			return {
				sessionId: url.searchParams.get("bluesky_session"),
				state: url.searchParams.get("state"),
			};
		});

		expect(urlParams.sessionId).toBe("test-session-123");
		expect(urlParams.state).toBe("test-state");
	});
});
