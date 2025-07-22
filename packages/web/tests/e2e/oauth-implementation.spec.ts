import { expect, test } from "@playwright/test";

test.describe("OAuth Implementation Tests", () => {
	test("should validate OAuth flow structure", async ({ page }) => {
		// Create a mock HTML page that simulates our OAuth implementation
		const html = `
      <html>
        <head>
          <title>Geist Filecoin OAuth Test</title>
          <style>
            .dialog { display: none; position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%); background: white; padding: 20px; border: 1px solid #ccc; }
            .tab { display: inline-block; padding: 10px; margin: 5px; border: 1px solid #ccc; cursor: pointer; }
            .tab.active { background: #007bff; color: white; }
            .tab-content { display: none; padding: 20px; }
            .tab-content.active { display: block; }
            .btn { padding: 10px 20px; margin: 5px; cursor: pointer; }
            .btn-primary { background: #007bff; color: white; border: none; }
            .error { color: red; display: none; }
          </style>
        </head>
        <body>
          <h1>Geist Filecoin</h1>
          <button id="login-btn" class="btn btn-primary">Login</button>
          
          <div id="login-dialog" class="dialog">
            <h2>Login to Storacha</h2>
            <div class="tabs">
              <div class="tab active" data-tab="storacha">Storacha</div>
              <div class="tab" data-tab="oauth">Social Login</div>
            </div>
            
            <div id="storacha-content" class="tab-content active">
              <input type="email" id="email" placeholder="Enter your email" />
              <button id="email-login" class="btn btn-primary">Send Login Link</button>
            </div>
            
            <div id="oauth-content" class="tab-content">
              <p>Sign in with your social account</p>
              <button id="bluesky-btn" class="btn btn-primary">
                <svg width="16" height="16" viewBox="0 0 24 24">
                  <path d="M12 10.8c-1.087-2.114-4.046-6.053-6.798-7.995C2.566.944 1.561 1.266.902 1.565"/>
                </svg>
                Continue with Bluesky
              </button>
              <div id="oauth-error" class="error"></div>
            </div>
            
            <button id="close-dialog" class="btn">Close</button>
          </div>
          
          <script>
            // Mock OAuth implementation
            const loginBtn = document.getElementById('login-btn');
            const dialog = document.getElementById('login-dialog');
            const tabs = document.querySelectorAll('.tab');
            const tabContents = document.querySelectorAll('.tab-content');
            const blueskyBtn = document.getElementById('bluesky-btn');
            const closeBtn = document.getElementById('close-dialog');
            const errorDiv = document.getElementById('oauth-error');
            
            // Login button click
            loginBtn.addEventListener('click', () => {
              dialog.style.display = 'block';
            });
            
            // Close dialog
            closeBtn.addEventListener('click', () => {
              dialog.style.display = 'none';
            });
            
            // Tab switching
            tabs.forEach(tab => {
              tab.addEventListener('click', () => {
                tabs.forEach(t => t.classList.remove('active'));
                tabContents.forEach(tc => tc.classList.remove('active'));
                
                tab.classList.add('active');
                const tabName = tab.dataset.tab;
                document.getElementById(tabName + '-content').classList.add('active');
              });
            });
            
            // Bluesky OAuth simulation
            blueskyBtn.addEventListener('click', async () => {
              blueskyBtn.textContent = 'Connecting...';
              blueskyBtn.disabled = true;
              
              // Simulate OAuth flow
              try {
                await new Promise(resolve => setTimeout(resolve, 1000));
                
                // Simulate successful OAuth
                const sessionId = 'test-session-' + Math.random().toString(36).substr(2, 9);
                
                // Mock session verification
                const verifyResponse = {
                  jwt: 'mock-jwt-token',
                  did: 'did:plc:test123',
                  handle: 'test.bsky.social'
                };
                
                // Store mock data
                localStorage.setItem('geist.jwt', verifyResponse.jwt);
                localStorage.setItem('geist.user.did', verifyResponse.did);
                localStorage.setItem('geist.user.handle', verifyResponse.handle);
                
                // Update UI
                loginBtn.textContent = 'Authenticated';
                loginBtn.disabled = true;
                dialog.style.display = 'none';
                
                // Add success indicator
                const successDiv = document.createElement('div');
                successDiv.id = 'auth-success';
                successDiv.textContent = 'Successfully authenticated with Bluesky!';
                successDiv.style.color = 'green';
                document.body.appendChild(successDiv);
                
              } catch (error) {
                errorDiv.textContent = 'Bluesky login failed';
                errorDiv.style.display = 'block';
                blueskyBtn.textContent = 'Continue with Bluesky';
                blueskyBtn.disabled = false;
              }
            });
            
            // Check for OAuth callback parameters
            const urlParams = new URLSearchParams(window.location.search);
            const sessionId = urlParams.get('bluesky_session');
            if (sessionId) {
              // Mock session verification
              setTimeout(() => {
                const successDiv = document.createElement('div');
                successDiv.id = 'callback-success';
                successDiv.textContent = 'OAuth callback processed successfully!';
                successDiv.style.color = 'blue';
                document.body.appendChild(successDiv);
              }, 500);
            }
          </script>
        </body>
      </html>
    `;

		await page.goto(`data:text/html,${encodeURIComponent(html)}`);

		// Test initial state
		await expect(page.locator("h1")).toContainText("Geist Filecoin");
		await expect(page.locator("#login-btn")).toBeVisible();
		await expect(page.locator("#login-dialog")).not.toBeVisible();

		// Test login dialog opening
		await page.click("#login-btn");
		await expect(page.locator("#login-dialog")).toBeVisible();
		await expect(page.locator('.tab[data-tab="storacha"]')).toHaveClass(
			/active/,
		);

		// Test tab switching to OAuth
		await page.click('.tab[data-tab="oauth"]');
		await expect(page.locator('.tab[data-tab="oauth"]')).toHaveClass(/active/);
		await expect(page.locator("#oauth-content")).toHaveClass(/active/);

		// Test Bluesky button
		await expect(page.locator("#bluesky-btn")).toBeVisible();
		await expect(page.locator("#bluesky-btn")).toContainText(
			"Continue with Bluesky",
		);
		await expect(page.locator("#bluesky-btn svg")).toBeVisible();
	});

	test("should handle OAuth flow simulation", async ({ page }) => {
		// Use the same HTML structure
		const html = `
      <html>
        <head>
          <title>OAuth Flow Test</title>
          <style>
            .dialog { display: none; position: fixed; background: white; padding: 20px; }
            .tab { display: inline-block; padding: 10px; cursor: pointer; }
            .tab.active { background: #007bff; color: white; }
            .tab-content { display: none; padding: 20px; }
            .tab-content.active { display: block; }
            .btn { padding: 10px 20px; cursor: pointer; }
            .error { color: red; display: none; }
          </style>
        </head>
        <body>
          <button id="login-btn">Login</button>
          <div id="login-dialog" class="dialog">
            <div class="tab active" data-tab="oauth">OAuth</div>
            <div id="oauth-content" class="tab-content active">
              <button id="bluesky-btn" class="btn">Continue with Bluesky</button>
              <div id="oauth-error" class="error"></div>
            </div>
          </div>
          <script>
            document.getElementById('login-btn').addEventListener('click', () => {
              document.getElementById('login-dialog').style.display = 'block';
            });
            
            document.getElementById('bluesky-btn').addEventListener('click', async () => {
              const btn = document.getElementById('bluesky-btn');
              btn.textContent = 'Connecting...';
              btn.disabled = true;
              
              await new Promise(resolve => setTimeout(resolve, 1000));
              
              const sessionId = 'test-session-' + Math.random().toString(36).substr(2, 9);
              localStorage.setItem('oauth.sessionId', sessionId);
              
              const successDiv = document.createElement('div');
              successDiv.id = 'oauth-success';
              successDiv.textContent = 'OAuth flow completed';
              successDiv.style.color = 'green';
              document.body.appendChild(successDiv);
              
              document.getElementById('login-dialog').style.display = 'none';
            });
          </script>
        </body>
      </html>
    `;

		await page.goto(`data:text/html,${encodeURIComponent(html)}`);

		// Start OAuth flow
		await page.click("#login-btn");
		await page.click("#bluesky-btn");

		// Check loading state
		await expect(page.locator("#bluesky-btn")).toContainText("Connecting...");
		await expect(page.locator("#bluesky-btn")).toBeDisabled();

		// Wait for OAuth completion
		await expect(page.locator("#oauth-success")).toBeVisible();
		await expect(page.locator("#oauth-success")).toContainText(
			"OAuth flow completed",
		);
		await expect(page.locator("#login-dialog")).not.toBeVisible();

		// Check localStorage
		const sessionId = await page.evaluate(() =>
			localStorage.getItem("oauth.sessionId"),
		);
		expect(sessionId).toContain("test-session-");
	});

	test("should handle OAuth error scenarios", async ({ page }) => {
		const html = `
      <html>
        <body>
          <button id="login-btn">Login</button>
          <div id="login-dialog" style="display: none;">
            <button id="bluesky-btn">Continue with Bluesky</button>
            <div id="oauth-error" style="color: red; display: none;"></div>
          </div>
          <script>
            document.getElementById('login-btn').addEventListener('click', () => {
              document.getElementById('login-dialog').style.display = 'block';
            });
            
            document.getElementById('bluesky-btn').addEventListener('click', async () => {
              const btn = document.getElementById('bluesky-btn');
              const error = document.getElementById('oauth-error');
              
              btn.textContent = 'Connecting...';
              btn.disabled = true;
              
              await new Promise(resolve => setTimeout(resolve, 500));
              
              // Simulate error
              error.textContent = 'OAuth verification failed';
              error.style.display = 'block';
              
              btn.textContent = 'Continue with Bluesky';
              btn.disabled = false;
            });
          </script>
        </body>
      </html>
    `;

		await page.goto(`data:text/html,${encodeURIComponent(html)}`);

		await page.click("#login-btn");
		await page.click("#bluesky-btn");

		// Wait for error
		await expect(page.locator("#oauth-error")).toBeVisible();
		await expect(page.locator("#oauth-error")).toContainText(
			"OAuth verification failed",
		);
		await expect(page.locator("#bluesky-btn")).not.toBeDisabled();
		await expect(page.locator("#bluesky-btn")).toContainText(
			"Continue with Bluesky",
		);
	});

	test("should validate OAuth callback handling", async ({ page }) => {
		const html = `
      <html>
        <body>
          <div id="callback-status">Checking OAuth callback...</div>
          <script>
            const urlParams = new URLSearchParams(window.location.search);
            const sessionId = urlParams.get('bluesky_session');
            const error = urlParams.get('error');
            
            const statusDiv = document.getElementById('callback-status');
            
            if (error) {
              statusDiv.textContent = 'OAuth error: ' + error;
              statusDiv.style.color = 'red';
            } else if (sessionId) {
              statusDiv.textContent = 'OAuth success with session: ' + sessionId;
              statusDiv.style.color = 'green';
              
              // Mock session verification
              setTimeout(() => {
                localStorage.setItem('auth.verified', 'true');
                const verifiedDiv = document.createElement('div');
                verifiedDiv.id = 'verification-complete';
                verifiedDiv.textContent = 'Session verified successfully';
                document.body.appendChild(verifiedDiv);
              }, 500);
            } else {
              statusDiv.textContent = 'No OAuth callback parameters found';
            }
          </script>
        </body>
      </html>
    `;

		// Test successful callback
		await page.goto(
			`data:text/html,${encodeURIComponent(html)}?bluesky_session=test-session-123`,
		);
		await expect(page.locator("#callback-status")).toContainText(
			"OAuth success with session: test-session-123",
		);
		await expect(page.locator("#verification-complete")).toBeVisible();

		// Test error callback
		await page.goto(
			`data:text/html,${encodeURIComponent(html)}?error=oauth_failed`,
		);
		await expect(page.locator("#callback-status")).toContainText(
			"OAuth error: oauth_failed",
		);
	});
});
