import { makeDurableObject, makeWorker } from "@livestore/sync-cf/cf-worker";
import { createClient, createDelegation } from "@geist-filecoin/storage";

import { Router, cors, error, json } from 'itty-router'

const { preflight, corsify } = cors({
	origin: '*',
	credentials: true,
	allowMethods: ['GET', 'POST', 'OPTIONS']
})


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
	finally: [ corsify],
});


  
// UUID generation route
router.get("/api/uuid", async () => {
	
	return new Response(JSON.stringify({ uuid }), {
		headers: {
			"Content-Type": "application/json",
		},
	});
});

router.post("/api/auth", async () => {
	// TODO remove hardcode and use secrets provider

	const uuid = crypto.randomUUID();
		
	const client = await createClient({
		keyString: "keyString",
		proofString: "proofString",
	});

	await createDelegation({
		client,
		userDid: "did:key:test-user",
	});

	
	return new Response(
		JSON.stringify({
			user: {
				name: "abc",
			},
		}),
		{
			headers: {
				"Content-Type": "application/json",
			},
		}
	);
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