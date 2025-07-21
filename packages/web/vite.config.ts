import { spawn } from "node:child_process";
import path from "node:path";
import { livestoreDevtoolsPlugin } from "@livestore/devtools-vite";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

// https://vitejs.dev/config/
export default defineConfig({
	plugins: [
		react(),
		tailwindcss(),
		livestoreDevtoolsPlugin({ schemaPath: "./src/livestore/schema.ts" }),
	],
	resolve: {
		alias: {
			"@": path.resolve(__dirname, "./src"),
		},
		conditions: ["browser", "module", "import"],
	},
	server: {
		port: process.env.PORT ? Number(process.env.PORT) : 3000,
		allowedHosts: ["tunnel.geist.network"],
		// https: {
		// 	cert: "../../local_cert.pem",
		// 	key: "../../local_cert-key.pem",
		// },
	},
	worker: { format: "es" },
	test: {
		environment: "jsdom",
		globals: true,
		setupFiles: ["./src/test/setup.ts"],
	},
	ssr: {
		noExternal: ["@web3-storage/w3up-client"],
	},
	define: {
		global: "globalThis",
	},
	optimizeDeps: {
		include: ["multiformats"],
	},
	build: {
		commonjsOptions: {
			include: [
				/@atproto\/oauth-client-browser/,
				/multiformats/,
				/node_modules/,
			],
		},
	},
});
