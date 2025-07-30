import path from "node:path";
import { cloudflare } from "@cloudflare/vite-plugin";
import { livestoreDevtoolsPlugin } from "@livestore/devtools-vite";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react-swc";
import { defineConfig } from "vite";
import { analyzer } from "vite-bundle-analyzer";

// https://vite.dev/config/
export default defineConfig({
	plugins: [
		react(),
		cloudflare(),
		tailwindcss(),
		livestoreDevtoolsPlugin({ schemaPath: "./src/livestore/schema.ts" }),
		process.env.ANALYZE && analyzer(),
	].filter(Boolean),

	resolve: {
		alias: {
			"@": path.resolve(__dirname, "./src"),
		},
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
					"react-vendor": ["react", "react-dom", "react-router-dom"],
					"ui-vendor": [
						"lucide-react",
						"@radix-ui/react-dialog",
						"@radix-ui/react-dropdown-menu",
						"@radix-ui/react-avatar",
						"@radix-ui/react-select",
						"@radix-ui/react-tabs",
						"@radix-ui/react-tooltip",
						"@radix-ui/react-collapsible",
						"@radix-ui/react-label",
						"@radix-ui/react-progress",
						"@radix-ui/react-slot",
						"@radix-ui/react-checkbox",
						"class-variance-authority",
						"clsx",
						"tailwind-merge",
						"ky",
					],
					"storage-vendor": ["@lighthouse-web3/sdk", "@storacha/client"],
					"livestore-vendor": [
						"@livestore/react",
						"@livestore/adapter-web",
						"@livestore/livestore",
						"@livestore/sync-cf",
					],
					"markdown-editor": ["react-markdown"],
					"form-vendor": ["react-hook-form", "@hookform/resolvers", "zod"],
					"auth-vendor": [
						"@atproto/oauth-client-browser",
						"@atproto/jwk-webcrypto",
					],
				},
			},
		},
	},
	optimizeDeps: {
		include: ["multiformats"],
	},
});
