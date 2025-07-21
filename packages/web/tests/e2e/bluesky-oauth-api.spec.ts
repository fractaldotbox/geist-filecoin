import { expect, test } from "@playwright/test";

test.describe("Bluesky OAuth API Endpoints", () => {
	const API_BASE_URL = "https://localhost:8787";

	test.describe("OAuth Login Endpoint", () => {
		test("should redirect to Bluesky OAuth when accessing login endpoint", async ({
			page,
		}) => {
			// Visit the OAuth login endpoint directly
			const response = await page.goto(
				`${API_BASE_URL}/api/auth/bluesky/login`,
			);

			// Should get a redirect response
			expect(response?.status()).toBe(302);

			// Should redirect to a Bluesky OAuth URL
			const location = response?.headers()?.location;
			expect(location).toBeTruthy();
			expect(location).toContain("oauth");
		});

		test("should include handle parameter in OAuth URL when provided", async ({
			page,
		}) => {
			const response = await page.goto(
				`${API_BASE_URL}/api/auth/bluesky/login?handle=test.bsky.social`,
			);

			expect(response?.status()).toBe(302);

			const location = response?.headers()?.location;
			expect(location).toBeTruthy();
			expect(location).toContain("test.bsky.social");
		});

		test("should generate unique state parameter for each request", async ({
			page,
		}) => {
			const response1 = await page.goto(
				`${API_BASE_URL}/api/auth/bluesky/login`,
			);
			const location1 = response1?.headers()?.location;

			const response2 = await page.goto(
				`${API_BASE_URL}/api/auth/bluesky/login`,
			);
			const location2 = response2?.headers()?.location;

			// Extract state parameters
			const state1 = new URL(location1!).searchParams.get("state");
			const state2 = new URL(location2!).searchParams.get("state");

			expect(state1).toBeTruthy();
			expect(state2).toBeTruthy();
			expect(state1).not.toBe(state2);
		});
	});

	test.describe("OAuth Callback Endpoint", () => {
		test("should handle missing code parameter", async ({ page }) => {
			const response = await page.goto(
				`${API_BASE_URL}/api/auth/bluesky/callback?state=test-state`,
			);

			// Should redirect to frontend with error
			expect(response?.status()).toBe(302);

			const location = response?.headers()?.location;
			expect(location).toContain("error=oauth_failed");
		});

		test("should handle missing state parameter", async ({ page }) => {
			const response = await page.goto(
				`${API_BASE_URL}/api/auth/bluesky/callback?code=test-code`,
			);

			// Should redirect to frontend with error
			expect(response?.status()).toBe(302);

			const location = response?.headers()?.location;
			expect(location).toContain("error=oauth_failed");
		});

		test("should handle OAuth error parameter", async ({ page }) => {
			const response = await page.goto(
				`${API_BASE_URL}/api/auth/bluesky/callback?error=access_denied&state=test-state`,
			);

			// Should redirect to frontend with error
			expect(response?.status()).toBe(302);

			const location = response?.headers()?.location;
			expect(location).toContain("error=oauth_failed");
		});

		test("should handle invalid state parameter", async ({ page }) => {
			const response = await page.goto(
				`${API_BASE_URL}/api/auth/bluesky/callback?code=test-code&state=invalid-state`,
			);

			// Should redirect to frontend with error
			expect(response?.status()).toBe(302);

			const location = response?.headers()?.location;
			expect(location).toContain("error=oauth_failed");
		});
	});

	test.describe("OAuth Verify Endpoint", () => {
		test("should require sessionId parameter", async ({ page }) => {
			const response = await page.request.post(
				`${API_BASE_URL}/api/auth/bluesky/verify`,
				{
					data: {},
				},
			);

			expect(response.status()).toBe(400);

			const body = await response.json();
			expect(body.error).toContain("Session ID is required");
		});

		test("should handle invalid session ID", async ({ page }) => {
			const response = await page.request.post(
				`${API_BASE_URL}/api/auth/bluesky/verify`,
				{
					data: {
						sessionId: "invalid-session-id",
					},
				},
			);

			expect(response.status()).toBe(401);

			const body = await response.json();
			expect(body.error).toContain("Invalid or expired session");
		});

		test("should accept valid JSON content type", async ({ page }) => {
			const response = await page.request.post(
				`${API_BASE_URL}/api/auth/bluesky/verify`,
				{
					headers: {
						"Content-Type": "application/json",
					},
					data: JSON.stringify({
						sessionId: "test-session-id",
					}),
				},
			);

			// Should get 401 for invalid session, but not a content-type error
			expect(response.status()).toBe(401);
		});
	});

	test.describe("CORS Configuration", () => {
		test("should handle CORS preflight requests", async ({ page }) => {
			const response = await page.request.fetch(
				`${API_BASE_URL}/api/auth/bluesky/verify`,
				{
					method: "OPTIONS",
					headers: {
						Origin: "http://localhost:5173",
						"Access-Control-Request-Method": "POST",
						"Access-Control-Request-Headers": "Content-Type",
					},
				},
			);

			expect(response.status()).toBe(200);
			expect(response.headers()["access-control-allow-origin"]).toBe("*");
			expect(response.headers()["access-control-allow-methods"]).toContain(
				"POST",
			);
		});

		test("should include CORS headers in responses", async ({ page }) => {
			const response = await page.request.post(
				`${API_BASE_URL}/api/auth/bluesky/verify`,
				{
					data: {
						sessionId: "test-session-id",
					},
				},
			);

			expect(response.headers()["access-control-allow-origin"]).toBe("*");
			expect(response.headers()["access-control-allow-credentials"]).toBe(
				"true",
			);
		});
	});

	test.describe("API Error Handling", () => {
		test("should return proper error format for server errors", async ({
			page,
		}) => {
			// This test would require mocking internal server errors
			// For now, we'll test the structure with an invalid request
			const response = await page.request.post(
				`${API_BASE_URL}/api/auth/bluesky/verify`,
				{
					data: {
						sessionId: "invalid-session-id",
					},
				},
			);

			expect(response.status()).toBe(401);

			const body = await response.json();
			expect(body).toHaveProperty("error");
			expect(typeof body.error).toBe("string");
		});

		test("should handle malformed JSON requests", async ({ page }) => {
			const response = await page.request.post(
				`${API_BASE_URL}/api/auth/bluesky/verify`,
				{
					headers: {
						"Content-Type": "application/json",
					},
					data: "invalid json",
				},
			);

			// Should return appropriate error status
			expect([400, 500]).toContain(response.status());
		});
	});

	test.describe("Rate Limiting and Security", () => {
		test("should handle rapid successive requests", async ({ page }) => {
			// Test that the API can handle multiple rapid requests
			const promises = Array(5)
				.fill(null)
				.map(() =>
					page.request.post(`${API_BASE_URL}/api/auth/bluesky/verify`, {
						data: {
							sessionId: "test-session-id",
						},
					}),
				);

			const responses = await Promise.all(promises);

			// All requests should return consistent error responses
			for (const response of responses) {
				expect(response.status()).toBe(401);
			}
		});

		test("should validate content-type for POST requests", async ({ page }) => {
			const response = await page.request.post(
				`${API_BASE_URL}/api/auth/bluesky/verify`,
				{
					headers: {
						"Content-Type": "text/plain",
					},
					data: "not json",
				},
			);

			// Should handle non-JSON content appropriately
			expect([400, 415, 500]).toContain(response.status());
		});
	});
});
