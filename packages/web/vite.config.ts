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
	},
	server: {
		port: process.env.PORT ? Number(process.env.PORT) : 3000,
	},
	worker: { format: "es" },
	build: {
		rollupOptions: {
			output: {
				manualChunks: {
					vendor: ['react', 'react-dom', 'react-router-dom'],
					ui: ['lucide-react', '@radix-ui/react-dialog', '@radix-ui/react-dropdown-menu'],
					storage: ['@lighthouse-web3/sdk', '@web3-storage/w3up-client'],
					livestore: ['@livestore/react', '@livestore/adapter-web', '@livestore/livestore'],
				},
			},
		},
	},
	test: {
		environment: "jsdom",
		globals: true,
		setupFiles: ["./src/test/setup.ts"],
	},
});
