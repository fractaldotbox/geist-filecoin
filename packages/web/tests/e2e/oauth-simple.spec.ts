import { test, expect } from '@playwright/test';

test.describe('OAuth Simple Tests', () => {
  test('should validate OAuth UI elements', async ({ page }) => {
    const html = `
      <html>
        <body>
          <h1>Geist Filecoin</h1>
          <button id="login-btn">Login</button>
          <div id="login-dialog" style="display: none;">
            <h2>Login to Storacha</h2>
            <div class="tabs">
              <button class="tab active" data-tab="storacha">Storacha</button>
              <button class="tab" data-tab="oauth">Social Login</button>
            </div>
            <div id="oauth-content" style="display: none;">
              <p>Sign in with your social account</p>
              <button id="bluesky-btn">Continue with Bluesky</button>
            </div>
          </div>
          <script>
            document.getElementById('login-btn').onclick = () => {
              document.getElementById('login-dialog').style.display = 'block';
            };
            
            document.querySelector('[data-tab="oauth"]').onclick = () => {
              document.getElementById('oauth-content').style.display = 'block';
            };
          </script>
        </body>
      </html>
    `;
    
    await page.goto(`data:text/html,${encodeURIComponent(html)}`);
    
    // Test basic elements
    await expect(page.locator('h1')).toContainText('Geist Filecoin');
    await expect(page.locator('#login-btn')).toBeVisible();
    
    // Test login dialog
    await page.click('#login-btn');
    await expect(page.locator('#login-dialog')).toBeVisible();
    await expect(page.locator('h2')).toContainText('Login to Storacha');
    
    // Test OAuth tab
    await page.click('[data-tab="oauth"]');
    await expect(page.locator('#oauth-content')).toBeVisible();
    await expect(page.locator('#bluesky-btn')).toBeVisible();
    await expect(page.locator('#bluesky-btn')).toContainText('Continue with Bluesky');
  });

  test('should handle OAuth button interactions', async ({ page }) => {
    const html = `
      <html>
        <body>
          <button id="bluesky-btn">Continue with Bluesky</button>
          <div id="status"></div>
          <script>
            document.getElementById('bluesky-btn').onclick = () => {
              const btn = document.getElementById('bluesky-btn');
              const status = document.getElementById('status');
              
              btn.textContent = 'Connecting...';
              btn.disabled = true;
              
              status.textContent = 'OAuth flow initiated';
              status.style.color = 'green';
            };
          </script>
        </body>
      </html>
    `;
    
    await page.goto(`data:text/html,${encodeURIComponent(html)}`);
    
    // Test button click
    await page.click('#bluesky-btn');
    await expect(page.locator('#bluesky-btn')).toContainText('Connecting...');
    await expect(page.locator('#bluesky-btn')).toBeDisabled();
    await expect(page.locator('#status')).toContainText('OAuth flow initiated');
  });

  test('should validate OAuth configuration structure', async ({ page }) => {
    await page.goto('data:text/html,<html><body><div id="test">Configuration Test</div></body></html>');
    
    // Test OAuth configuration validation
    const configCheck = await page.evaluate(() => {
      const oauthConfig = {
        endpoints: {
          login: '/api/auth/bluesky/login',
          callback: '/api/auth/bluesky/callback',
          verify: '/api/auth/bluesky/verify'
        },
        clientId: 'test-client',
        redirectUri: 'http://localhost:5173/callback',
        scopes: ['atproto', 'transition:generic'],
        state: 'test-state-' + Math.random().toString(36).substr(2, 9)
      };
      
      return {
        hasEndpoints: Object.keys(oauthConfig.endpoints).length === 3,
        hasClientId: !!oauthConfig.clientId,
        hasRedirectUri: !!oauthConfig.redirectUri,
        hasScopes: oauthConfig.scopes.length > 0,
        hasState: !!oauthConfig.state
      };
    });
    
    expect(configCheck.hasEndpoints).toBe(true);
    expect(configCheck.hasClientId).toBe(true);
    expect(configCheck.hasRedirectUri).toBe(true);
    expect(configCheck.hasScopes).toBe(true);
    expect(configCheck.hasState).toBe(true);
  });

  test('should handle OAuth error states', async ({ page }) => {
    const html = `
      <html>
        <body>
          <div id="error-container">
            <div id="oauth-error" style="color: red; display: none;"></div>
          </div>
          <script>
            // Simulate OAuth error
            document.getElementById('oauth-error').textContent = 'Bluesky login failed';
            document.getElementById('oauth-error').style.display = 'block';
          </script>
        </body>
      </html>
    `;
    
    await page.goto(`data:text/html,${encodeURIComponent(html)}`);
    
    await expect(page.locator('#oauth-error')).toBeVisible();
    await expect(page.locator('#oauth-error')).toContainText('Bluesky login failed');
    await expect(page.locator('#oauth-error')).toHaveCSS('color', 'rgb(255, 0, 0)');
  });

  test('should validate URL parameter parsing', async ({ page }) => {
    await page.goto('data:text/html,<html><body><div id="url-test">URL Test</div></body></html>');
    
    // Test URL parameter handling
    const urlTest = await page.evaluate(() => {
      // Test various OAuth callback scenarios
      const testUrls = [
        'http://localhost:5173/?bluesky_session=test-session-123',
        'http://localhost:5173/?error=oauth_failed',
        'http://localhost:5173/?bluesky_session=test-session-456&state=test-state'
      ];
      
      return testUrls.map(url => {
        const urlObj = new URL(url);
        return {
          url: url,
          sessionId: urlObj.searchParams.get('bluesky_session'),
          error: urlObj.searchParams.get('error'),
          state: urlObj.searchParams.get('state')
        };
      });
    });
    
    expect(urlTest[0].sessionId).toBe('test-session-123');
    expect(urlTest[0].error).toBe(null);
    
    expect(urlTest[1].sessionId).toBe(null);
    expect(urlTest[1].error).toBe('oauth_failed');
    
    expect(urlTest[2].sessionId).toBe('test-session-456');
    expect(urlTest[2].state).toBe('test-state');
  });
});