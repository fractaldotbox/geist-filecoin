import { type DurableObjectId, DurableObject } from "cloudflare:workers";
import jwt from "@tsndr/cloudflare-worker-jwt";
import { authorizeUcan } from "@geist-filecoin/auth";
import type { AccessPolicy, AuthInput } from "@geist-filecoin/auth";
import { Router, cors, error, json } from "itty-router";
import type { Env } from "@livestore/sync-cf/cf-worker";


export class Policies extends DurableObject<Env> {
	private policies: any[] = [];
	private storage: any;

	constructor(state: any, env: any) {
		super(state, env);
		this.storage = state.storage;
		console.log(this.storage.sql);

		this.init();
	}

	init() {
		this.storage.sql.exec(`CREATE TABLE IF NOT EXISTS policies(
			policyId  INTEGER PRIMARY KEY,
			name  TEXT
		  )`);
	}
	
	increment() {
	}

	async getAllPolicies() {
		this.policies = this.storage.sql.exec("SELECT * FROM policies;").toArray();
		return this.policies;
	}	
  
	async addPolicies(policies: any[]) {
		if (policies.length === 0) return;

		// const stmt = this.storage.sql.prepare(`INSERT OR REPLACE INTO policies (policyId, name) VALUES (?, ?)`);

		console.log(this.storage.sql);

		const values = policies.map(policy => [policy.policyId, policy.name])
		.map(([policyId, name])=>`( "${policyId}", "${name}" )`)
		.join(',')
		
		await this.storage.sql.exec(
			`INSERT OR REPLACE INTO policies (policyId, name) VALUES ${values}
			`,
			

		)
		
	}
}


const { preflight, corsify } = cors({
	origin: "*",
	credentials: true,
	allowMethods: ["GET", "POST", "OPTIONS"],
});


export const getId = (request: Request, env: any): DurableObjectId =>{
	return env.POLICIES.idFromName(new URL(request.url).pathname);
}

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

export const authorizeJWT = async (
	policies: AccessPolicy[],
	input: AuthInput,
	jwtSecret: string,
) => {
	// TO
	// TODO align token with claims / scope
	const token = await jwt.sign(
		{
			sub: input.subject,
			nbf: Math.floor(Date.now() / 1000) + 60 * 60, // Not before: Now + 1h
			exp: Math.floor(Date.now() / 1000) + 2 * (60 * 60), // Expires: Now + 2h
		},
		jwtSecret,
	);

	return token;
};

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

router.get("/websocket", async (request: Request, env: any) => {
	return await env.WORKER_LIVESTORE.fetch(request, env);
});

router.post("/api/iam", async (request: Request, env: any) => {
	const { did, policies } = await request.json();
	const id:DurableObjectId = env.POLICIES.idFromName(new URL(request.url).pathname);

	const policy = await env.POLICIES.get(id);
	console.log('env', policy)
	
	// Add policies with their IDs for upsert functionality
	await policy.addPolicies([{
			policyId: 1, // Default ID
			name: 'alice'
		},{
			policyId: 2, // Default ID
			name: 'bob'
		}]);

	return new Response(JSON.stringify({ message: "Policies stored" }), {
		headers: {
			"Content-Type": "application/json",
		},
	});
});


router.post("/api/auth/jwt", async (request: Request, env: any) => {
	const { did, tokenType } = await request.json();

	const policies = [
		{
			policyType: "env",
			policyCriteria: {
				whitelistEnvKey: "GEIST_USER",
				subject: did,
			},
			tokenType,
			policyAccess: {
				metadata: {},
				claims: ["admin:iam"],
			},
		},
	];

	const jwtSecret = await env.GEIST.get("GEIST_JWT_SECRET");

	console.log("auth for user", did);

	if (!did) {
		throw new Error("did is not set");
	}

	const jwt = await authorizeJWT(
		policies,
		{
			subject: did,
		},
		jwtSecret,
	);

	return new Response(
		JSON.stringify({
			jwt,
		}),
		{
			headers: {
				"Content-Type": "application/json",
			},
		},
	);
});

export default {
	fetch: (request: Request, env: any, ctx: any) => {
		return router.fetch(request, env, ctx);
	},
};
