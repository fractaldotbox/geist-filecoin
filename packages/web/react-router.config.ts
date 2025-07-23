import type { Config } from "@react-router/dev/config";

export default {
	ssr: true,
	appDirectory: "src/app",
	future: {
		unstable_viteEnvironmentApi: true,
	},
	async prerender() {
		return ["/", "/client-metadata.json"];
	},
} satisfies Config;
