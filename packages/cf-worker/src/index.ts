import {
	createClient,
	createDelegation,
	createUserDelegation,
	initStorachaClient,
} from "@geist-filecoin/storage";
import { makeDurableObject, makeWorker } from "@livestore/sync-cf/cf-worker";

import { Router, cors, error, json } from "itty-router";

const { preflight, corsify } = cors({
	origin: "*",
	credentials: true,
	allowMethods: ["GET", "POST", "OPTIONS"],
});

export class WebSocketServer extends makeDurableObject({
	onPush: async (message) => {
		console.log("onPush", message.batch);
	},
	onPull: async (message) => {
		console.log("onPull", message);
	},
}) {}

// Note AutoRouter not compatabile
const worker = makeWorker({
	validatePayload: (payload: any) => {
		if (payload?.authToken !== "insecure-token-change-me") {
			throw new Error("Invalid auth token");
		}
	},
	enableCORS: true,
});

const router = Router({
	before: [preflight],
	catch: error,
	finally: [corsify],
});

router.post("/api/upload", async (request: Request) => {
	console.log("upload");

	return new Response(JSON.stringify({ message: "Uploaded" }), {
		headers: {
			"Content-Type": "application/json",
		},
	});
});

router.post("/api/auth", async (request: Request) => {
	const { did } = await request.json();
	// TODO remove hardcode and use secrets provider

	// we could have 3 different agents (keys)
	// space owner - delegated to server
	// server agent - received delgation
	// user agent requesting delegation to the space

	// TODO provision from secrets
	const agentKeyString = "";
	const proofString = "";

	try {
		const { delegation } = await createUserDelegation({
			userDid: did,
			serverAgentKeyString: agentKeyString,
			proofString,
		});

		return new Response(delegation, {
			headers: {
				"Content-Type": "application/octet-stream",
				"Content-Length": delegation.byteLength.toString(),
			},
		});
	} catch (error) {
		console.log("error", error);
		const errorMessage =
			error instanceof Error ? error.message : "Unknown error";
		return new Response(JSON.stringify({ error: errorMessage }), {
			status: 500,
			headers: {
				"Content-Type": "application/json",
			},
		});
	}
});

// Fallback to original worker for all other routes
router.all("*", (request: Request, env: any, ctx: any) => {
	return worker.fetch(request, env, ctx);
});

export default {
	...worker,
	fetch: (request: Request, env: any, ctx: any) => {
		return router.fetch(request, env, ctx);
	},
};
