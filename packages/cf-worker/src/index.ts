import { DurableObject, type DurableObjectId } from "cloudflare:workers";
import { authorizeUcan } from "@geist-filecoin/auth";
import type { AccessPolicy, AuthInput } from "@geist-filecoin/auth";
import type { Env } from "@livestore/sync-cf/cf-worker";
import jwt from "@tsndr/cloudflare-worker-jwt";
import { Router, cors, error, json } from "itty-router";
import { Proof } from "@web3-storage/w3up-client";

export class Policies extends DurableObject<Env> {
	private policies: any[] = [];
	private storage: any;

	constructor(state: any, env: any) {
		super(state, env);
		this.storage = state.storage;
		this.init();
	}

	init() {
		this.storage.sql.exec(`CREATE TABLE IF NOT EXISTS policies(
			policyId TEXT PRIMARY KEY,
			criteriaType  TEXT,
			criteria  TEXT,
			access  TEXT
		  )`);
	}

	async getAllPolicies() {
		const allPolicies = this.storage.sql
			.exec("SELECT * FROM policies;")
			.toArray();

		console.log("DO getAllPolicies", allPolicies);

		return allPolicies.map((policy: any) => {
			return {
				...policy,
				criteria: JSON.parse(policy.criteria),
				access: JSON.parse(policy.access),
			};
		});
	}

	async addPolicies(policies: AccessPolicy[]) {
		if (policies.length === 0) return;

		console.log("DO addPolicies", policies);
		const values = policies
			.map((policy) => {
				const { criteriaType, criteria, access } = policy;
				const policyId = crypto.randomUUID();

				return [
					policyId,
					criteriaType,
					JSON.stringify(criteria).replace(/"/g, '""'),
					JSON.stringify(access).replace(/"/g, '""'),
				];
			})
			.map((values) => `( ${values.map((value) => `"${value}"`).join(",")} )`)
			.join(",");

		this.storage.sql.exec(
			`INSERT OR REPLACE INTO policies (policyId, criteriaType, criteria, access) VALUES ${values}
			`,
		);
	}
}

const { preflight, corsify } = cors({
	origin: "*",
	credentials: true,
	allowMethods: ["GET", "POST", "OPTIONS"],
});

export const getId = (request: Request, env: any): DurableObjectId => {
	return env.POLICIES.idFromName("geist-policies");
};

export const getPolicyDO = async (request: Request, env: any) => {
	const id: DurableObjectId = getId(request, env);
	const policy = await env.POLICIES.get(id);
	return policy;
};

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

export type DID = `did:${string}`;

router.post("/api/auth/ucan", async (request: Request, env: any) => {
	const requestBody = await request.json();
	const { agentDid, spaceId, accountProof }: { agentDid: DID; spaceId: string; accountProof: string } = requestBody;
	
	let parsedProof: any;
	let tokenType = "ucan"; // Default to ucan for UCAN tokens
	
	try {
		// Try to parse as a serialized UCAN token first
		parsedProof = await Proof.parse(accountProof);
		console.log("Successfully parsed accountProof as UCAN token", {
			audience: parsedProof.audience.did(),
			issuer: parsedProof.issuer.did(),
			capabilities: parsedProof.capabilities
		});
		
		// Extract information from the parsed UCAN token
		const audience = parsedProof.audience.did();
		const issuer = parsedProof.issuer.did();
		
		// Verify that the DID matches the proof's audience or issuer
		if (audience !== agentDid && issuer !== agentDid) {
			throw new Error("DID does not match UCAN token audience or issuer");
		}
		
	} catch (error) {
		console.error("Failed to parse accountProof as UCAN token, trying JSON fallback:", error);
		
		// Fallback: try to parse as JSON for backward compatibility
		try {
			const proof = JSON.parse(accountProof);
			
			// Validate required JSON properties
			if (!proof.audience?.did || !proof.issuer?.did || !proof.subject?.did) {
				throw new Error("Invalid JSON proof structure");
			}
			
			const audience = proof.audience.did();
			const issuer = proof.issuer.did();
			const subject = proof.subject.did();
			tokenType = proof.tokenType || "ucan";
			
			console.log("Successfully parsed accountProof as JSON", {
				audience,
				issuer,
				subject,
				tokenType
			});
			
		} catch (jsonError) {
			console.error("Failed to parse accountProof as JSON:", jsonError);
			throw new Error("Invalid account proof format - must be either a serialized UCAN token or valid JSON");
		}
	}

	const { agentKeyString, proofString } = await loadStorachaSecrets(env);

	if (!did) {
		throw new Error("did is not set");
	}

	const input: AuthInput = {
		subject: did,
		context: {
			spaceId,
			env: {
				GEIST_USER: await env.GEIST.get("GEIST_USER"),
			},
		},
	};

	const policyDO = await getPolicyDO(request, env);

	const policies = await policyDO.getAllPolicies();

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
	const requestBody = await request.json();
	const { policies }: { policies: AccessPolicy[] } = requestBody;
	console.log("iam add policies", policies);
	const policyDO = await getPolicyDO(request, env);

	// Add policies with their IDs for upsert functionality
	await policyDO.addPolicies(policies);

	return new Response(JSON.stringify({ message: "Policies stored" }), {
		headers: {
			"Content-Type": "application/json",
		},
	});
});

router.post("/api/auth/jwt", async (request: Request, env: any) => {
	const requestBody = await request.json();
	const { did, tokenType }: { did: string; tokenType?: string } = requestBody;

	const policyDO = await getPolicyDO(request, env);

	const policies = await policyDO.getAllPolicies();

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
