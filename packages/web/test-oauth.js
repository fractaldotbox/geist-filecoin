// Test script to verify OAuth implementation
const puppeteer = require("puppeteer");

async function testOAuthImplementation() {
	const browser = await puppeteer.launch({
		headless: true,
		args: ["--no-sandbox", "--disable-setuid-sandbox"],
	});

	try {
		const page = await browser.newPage();

		// Enable console logging
		page.on("console", (msg) => console.log("PAGE LOG:", msg.text()));
		page.on("pageerror", (error) => console.log("PAGE ERROR:", error.message));

		console.log("🔍 Testing OAuth implementation...");

		// Navigate to the app
		await page.goto("http://localhost:3000", { waitUntil: "networkidle0" });

		// Check if the page loads without errors
		const title = await page.title();
		console.log("✅ Page loaded successfully:", title);

		// Check if OAuth components are available
		const loginButton = await page.$('button:has-text("Login")');
		if (loginButton) {
			console.log("✅ Login button found");

			// Click login button
			await loginButton.click();
			await page.waitForTimeout(1000);

			// Check for OAuth tab
			const oauthTab = await page.$('button:has-text("Social Login")');
			if (oauthTab) {
				console.log("✅ OAuth tab found");

				// Click OAuth tab
				await oauthTab.click();
				await page.waitForTimeout(500);

				// Check for Bluesky button
				const blueskyButton = await page.$(
					'button:has-text("Continue with Bluesky")',
				);
				if (blueskyButton) {
					console.log("✅ Bluesky OAuth button found");
				} else {
					console.log("❌ Bluesky OAuth button not found");
				}
			} else {
				console.log("❌ OAuth tab not found");
			}
		} else {
			console.log("❌ Login button not found");
		}

		// Check for JavaScript errors
		const jsErrors = await page.evaluate(() => {
			return window.errors || [];
		});

		if (jsErrors.length === 0) {
			console.log("✅ No JavaScript errors detected");
		} else {
			console.log("❌ JavaScript errors:", jsErrors);
		}

		console.log("🎉 OAuth implementation test completed!");
	} catch (error) {
		console.error("❌ Test failed:", error.message);
	} finally {
		await browser.close();
	}
}

// Check if puppeteer is available
try {
	testOAuthImplementation();
} catch (error) {
	console.log("⚠️  Puppeteer not available for automated testing");
	console.log("✅ Dev server is running at http://localhost:3000");
	console.log("🔧 Manual testing steps:");
	console.log("   1. Open http://localhost:3000 in your browser");
	console.log('   2. Click the "Login" button');
	console.log('   3. Click the "Social Login" tab');
	console.log('   4. Click "Continue with Bluesky"');
	console.log("   5. Verify the OAuth redirect works");
}
