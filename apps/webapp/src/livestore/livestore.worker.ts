import { makeWorker } from "@livestore/adapter-web/worker";
import { makeCfSync } from "@livestore/sync-cf";

import { schema } from "@geist-filecoin/livestore-schema";

// Type declaration for import.meta.env
declare global {
	interface ImportMeta {
		env: Record<string, string | undefined>;
	}
}

makeWorker({
	schema,
	sync: {
		backend: makeCfSync({
			url: import.meta.env.VITE_LIVESTORE_SYNC_URL || "http://localhost:8787",
		}),
		initialSyncOptions: { _tag: "Blocking", timeout: 5000 },
	},
});
