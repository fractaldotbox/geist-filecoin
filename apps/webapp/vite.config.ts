import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'
import path from "node:path";
import { livestoreDevtoolsPlugin } from "@livestore/devtools-vite";
import tailwindcss from "@tailwindcss/vite";

import { cloudflare } from "@cloudflare/vite-plugin";

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(), cloudflare(),
		tailwindcss(),
		livestoreDevtoolsPlugin({ schemaPath: "./src/livestore/schema.ts" }),],

    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      }
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
        /@atproto\/jwt/,
				/multiformats/,
				/node_modules/,
			],
		},
		rollupOptions: {
			output: {
				manualChunks: {
					vendor: ["react", "react-dom", "react-router-dom"],
					ui: [
						"lucide-react",
						"@radix-ui/react-dialog",
						"@radix-ui/react-dropdown-menu",
					],
					storage: ["@lighthouse-web3/sdk", "@web3-storage/w3up-client"],
					livestore: [
						"@livestore/react",
						"@livestore/adapter-web",
						"@livestore/livestore",
					],
				},
			},
		},
	},
	optimizeDeps: {
		include: ["multiformats"],
	},
	test: {
		environment: "jsdom",
		globals: true,
		setupFiles: ["./src/test/setup.ts"],
	},
});