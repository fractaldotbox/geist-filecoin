import {
	createClient,
	createUserDelegation,
	initStorachaClient,
} from "@geist-filecoin/storage";
import { makeDurableObject, makeWorker } from "@livestore/sync-cf/cf-worker";

import { Router, cors, error, json } from "itty-router";
import { authorizeUcan } from "node_modules/@geist-filecoin/auth/src/policy-engine";

const { preflight, corsify } = cors({
	origin: "*",
	credentials: true,
	allowMethods: ["GET", "POST", "OPTIONS"],
});

// Custom error handler that logs errors
const errorHandler = (error: Error, request: Request) => {
	console.error("Router error:", {
		message: error.message,
		stack: error.stack,
		url: request.url,
		method: request.method,
		timestamp: new Date().toISOString(),
	});

	return new Response(
		JSON.stringify({
			error: "Internal Server Error",
			message: error.message,
		}),
		{
			status: 500,
			headers: {
				"Content-Type": "application/json",
			},
		},
	);
};

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
	catch: errorHandler,
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

export const loadStorachaSecrets = async (env: any) => {
	const agentKeyString = await env.STORACHA_AGENT_KEY_STRING.get();
	if (!agentKeyString) {
		throw new Error("STORACHA_AGENT_KEY_STRING is not set");
	}

	const proofString = await env.GEIST.get("STORACHA_PROOF_STRING");

	if (!proofString) {
		throw new Error("STORACHA_PROOF_STRING is not set");
	}

	return {
		agentKeyString,
		proofString,
	};
};

// Overall it's tricky to combine jwt & binary (ucan) token at once
// better off separate 2 requests from very beginning

router.post("/api/auth/ucan", async (request: Request, env: any) => {
	const { did, spaceId, tokenType } = await request.json();

	const { agentKeyString, proofString } = await loadStorachaSecrets(env);

	if (!did) {
		throw new Error("did is not set");
	}

	const input = {
		subject: did,
		tokenType,
		context: {
			spaceId,
			env: {
				GEIST_USER: await env.GEIST.get("GEIST_USER"),
			},
		},
	};

	// TODO load policies
	const policies = [
		{
			policyType: "env",
			policyCriteria: {
				whitelistEnvKey: "GEIST_USER",
				subject: did,
			},
			tokenType,
			policyAccess: {
				metadata: {
					spaceId,
				},
				claims: ["access/claim", "upload/list", "upload/add", "space/info"],
			},
		},
	];

	console.log("authorize input", input, policies);

	const ucan = await authorizeUcan(policies, input, {
		serverAgentKeyString: agentKeyString,
		proofString,
	});

	try {
		return new Response(ucan, {
			headers: {
				"Content-Type": "application/octet-stream",
				"Content-Length": ucan?.byteLength.toString() || "0",
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

router.post("/api/auth/jwt", async (request: Request, env: any) => {
	const { did, tokenType } = await request.json();

	console.log("auth for user", did);

	if (!did) {
		throw new Error("did is not set");
	}

	// TODO
	// Read secrets from environment bindings and KV
	return new Response(
		JSON.stringify({
			jwt: "",
		}),
		{
			headers: {
				"Content-Type": "application/json",
			},
		},
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
