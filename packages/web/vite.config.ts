import { spawn } from "node:child_process";
import path from "node:path";
import { cloudflare } from "@cloudflare/vite-plugin";
import { livestoreDevtoolsPlugin } from "@livestore/devtools-vite";
import { reactRouter } from "@react-router/dev/vite";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "vite";

// https://vitejs.dev/config/
export default defineConfig({
	plugins: [
		reactRouter(),
		tailwindcss(),
		livestoreDevtoolsPlugin({ schemaPath: "./src/livestore/schema.ts" }),
		cloudflare({
			viteEnvironment: { name: "ssr" },
			configPath: "./wrangler.toml",
		}),
	],
	resolve: {
		alias: {
			"@": path.resolve(__dirname, "./src"),
		},
		conditions: ["browser", "module", "import"],
	},
	server: {
		port: process.env.PORT ? Number(process.env.PORT) : 3000,
		allowedHosts: ["filecoin.geist.network", "tunnel.geist.network"],
	},
	worker: { format: "es" },
	build: {
		commonjsOptions: {
			include: [
				/@atproto\/oauth-client-browser/,
				/multiformats/,
				/node_modules/,
			],
		},
		rollupOptions: {},
	},
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
		include: ["cookie"],
	},
});
