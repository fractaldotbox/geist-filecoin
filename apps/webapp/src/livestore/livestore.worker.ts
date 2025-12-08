import { makeWorker } from "@livestore/adapter-web/worker";
import { makeWsSync } from "@livestore/sync-cf/client";

import { schema } from "./schema.js";

// Type declaration for import.meta.env
declare global {
	interface ImportMeta {
		env: Record<string, string | undefined>;
	}
}

makeWorker({
	schema,
	sync: {
		backend: makeWsSync({
			url: import.meta.env.VITE_LIVESTORE_SYNC_URL || "http://localhost:8787",
		}),
		initialSyncOptions: { _tag: "Blocking", timeout: 5000 },
	},
});
