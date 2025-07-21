import type { FullConfig } from "@playwright/test";

async function globalSetup(config: FullConfig) {
	// Set up test environment variables
	process.env.VITE_API_URL = "http://localhost:8787";
	process.env.VITE_LIVESTORE_SYNC_URL = "http://localhost:8787";

	// Set up test data
	console.log("Setting up global test environment...");

	// You could add any global setup here such as:
	// - Creating test users
	// - Setting up test databases
	// - Configuring external services

	console.log("Global setup complete");
}

export default globalSetup;
