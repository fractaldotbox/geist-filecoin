import { spawn } from "node:child_process";
import path from "node:path";
import { defineConfig } from "vite";

// https://vitejs.dev/config/
export default defineConfig({
	plugins: [
		{
			name: "wrangler-dev",
			configureServer: async (server) => {
				const wrangler = spawn(
					"./node_modules/.bin/wrangler",
					["dev", "--port", "8787"],
					{
						stdio: ["ignore", "inherit", "inherit"],
					},
				);
				const shutdown = () => {
					if (wrangler.killed === false) {
						wrangler.kill();
					}
					process.exit(0);
				};
				server.httpServer?.on("close", shutdown);
				process.on("SIGTERM", shutdown);
				process.on("SIGINT", shutdown);
				wrangler.on("exit", (code) =>
					console.error(`wrangler dev exited with code ${code}`),
				);
			},
		},
	],
	resolve: {
		alias: {
			"@": path.resolve(__dirname, "./src"),
		},
	},
	server: {
		port: process.env.PORT ? Number(process.env.PORT) : 60_001,
	},
	worker: { format: "es" },
});
