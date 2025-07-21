import { spawn } from "node:child_process";
import path from "node:path";
import { cloudflare } from "@cloudflare/vite-plugin";
import { defineConfig } from "vite";

// https://vitejs.dev/config/
export default defineConfig({
	plugins: [
		cloudflare({
			configPath: "./api/wrangler.toml",
			auxiliaryWorkers: [
				{
					configPath: "./livestore-sync/wrangler.toml",
				},
			],
		}),
	],
	resolve: {
		alias: {
			"@": path.resolve(__dirname, "./src"),
		},
	},
	server: {
		port: 8787,
		https: {
			cert: "../../local_cert.pem",
			key: "../../local_cert-key.pem",
		},
	},

	worker: { format: "es" },
	define: {
		global: "globalThis",
	},
});
