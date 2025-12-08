import { type ExecutionContext, WorkerEntrypoint } from "cloudflare:workers";
import {
	type CfTypes,
	makeDurableObject,
	makeWorker,
} from "@livestore/sync-cf/cf-worker";

// Define the environment type with the sync backend binding
type Env = CfTypes.Env & {
	SYNC_BACKEND_DO: CfTypes.DurableObjectNamespace;
};

export class SyncBackendDO extends makeDurableObject({
	onPush: async (message) => {
		console.log("onPush", message.batch);
	},
	onPull: async (message) => {
		console.log("onPull", message);
	},
}) {}

// Note AutoRouter not compatible
const syncWorker = makeWorker<Env>({
	syncBackendBinding: "SYNC_BACKEND_DO",
	validatePayload: (payload: unknown) => {
		if (
			typeof payload !== "object" ||
			payload === null ||
			!("authToken" in payload) ||
			payload.authToken !== "insecure-token-change-me"
		) {
			throw new Error("Invalid auth token");
		}
	},
	enableCORS: true,
});

export class WorkerLiveStore extends WorkerEntrypoint<Env> {
	// Currently, entrypoints without a named handler are not supported
	async fetch(request: Request) {
		return syncWorker.fetch(request, this.env, this.ctx as ExecutionContext);
	}
}

export default WorkerLiveStore;
