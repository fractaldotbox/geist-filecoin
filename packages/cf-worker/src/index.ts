import { DurableObject } from "cloudflare:workers";
import type { DurableObjectId } from "cloudflare:workers";
import { authorizeUcan } from "@geist-filecoin/auth";
import type { AccessPolicy, AuthInput } from "@geist-filecoin/auth";
import type { Env } from "@livestore/sync-cf/cf-worker";
import jwt from "@tsndr/cloudflare-worker-jwt";
import { Router, cors, error, json } from "itty-router";
import type { IRequest } from "itty-router";
import { initStorachaClient, listAllFiles, createGatewayUrl } from "@geist-filecoin/storage";
import { gcm } from '@noble/ciphers/aes.js';
import { utf8ToBytes, bytesToUtf8 } from '@noble/ciphers/utils.js';
import { randomBytes } from '@noble/ciphers/webcrypto.js';
import { Buffer } from 'node:buffer';
import * as jose from 'jose';

export class Policies extends DurableObject<Env> {
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
	const { agentDid, spaceId, tokenType } = await request.json();

	const { agentKeyString, proofString } = await loadStorachaSecrets(env);

	if (!agentDid) {
		throw new Error("did is not set");
	}

	const input = {
		subject: agentDid,
		tokenType,
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

router.get('/api/health', async (request: Request) => {
	return new Response(JSON.stringify({ status: "ok" }), {
		headers: {
			"Content-Type": "application/json",
		},
	});
});

router.get('/api/init/generateKey', async (request: Request, env: any) => {
	const keyBytes = 32;
	const key = randomBytes(keyBytes);

	const base64Key = Buffer.from(key).toString('base64');

	return new Response(JSON.stringify({ key: base64Key }), {
		headers: {
			"Content-Type": "application/json",
		},
	});
});

router.get('/api/test', async (request: Request, env: any) => {
	const encryptionKey = await env.ENCRYPTION_KEY.get();
	console.log("Encryption Key:", encryptionKey);
	return new Response(JSON.stringify({ message: "Test endpoint", encryptionKey }), {
		headers: {
			"Content-Type": "application/json",
		},
	});
});

router.get('/api/resources/:resourceId', async (request: IRequest, env: any) => {
	const resourceId = request.params.resourceId;
	const version = request.query.version;
	const shouldDecrypt = request.query.decrypt !== 'true';

	if (!resourceId) {
		return new Response(JSON.stringify({ error: "Resource ID is required" }), {
			status: 400,
			headers: { "Content-Type": "application/json" },
		});
	}

	let secretKey: any = null;

	// Only get encryption key if decryption is needed
	if (shouldDecrypt) {
		const encryptionKeyBase64 = await env.ENCRYPTION_KEY.get();
		if (!encryptionKeyBase64) {
			return new Response(JSON.stringify({ error: "Encryption key not configured" }), {
				status: 500,
				headers: { "Content-Type": "application/json" },
			});
		}

		// Convert base64 key to secret key for jose
		const keyBytes = new Uint8Array(Buffer.from(encryptionKeyBase64, 'base64'));
		secretKey = await jose.importJWK({
			kty: 'oct',
			k: jose.base64url.encode(keyBytes)
		});
	}

	const { agentKeyString, proofString } = await loadStorachaSecrets(env);

	const { client, space } = await initStorachaClient({
		keyString: agentKeyString,
		proofString,
	});

	const uploadList = await listAllFiles({ client, spaceDid: space.did() });

	// Sort by updatedAt descending (newest first)
	const sortedUploads = uploadList.sort((a, b) =>
		new Date(b.updatedAt || b.insertedAt).getTime() - new Date(a.updatedAt || a.insertedAt).getTime()
	);

	const resourceFileName = shouldDecrypt ? `${resourceId}.encrypted.json` : `${resourceId}.json`;
	const foundResources: any[] = [];

	// Helper function to process resource data
	const processResourceData = (resourceData: any, upload: any, cid: string, resourceUrl: string) => {
		const mode = resourceData.meta?.mode || 'replace';

		foundResources.push({
			data: resourceData.data,
			meta: {
				...resourceData.meta,
				cid,
				updatedAt: upload.updatedAt,
				insertedAt: upload.insertedAt,
				gatewayUrl: resourceUrl,
			},
		});

		// Return true if we should stop processing (latestOnly or replace mode)
		return version === 'latestOnly' || mode === 'replace';
	};

	// Fetch resources from newest to oldest uploads
	for (const upload of sortedUploads) {
		try {
			const cid = upload.root.toString();
			const resourceUrl = `${createGatewayUrl(cid)}${resourceFileName}`;
			const response = await fetch(resourceUrl);

			if (response.ok) {
				const fileContent = await response.text();
				let resourceData: any;

				try {
					if (shouldDecrypt) {
						const { plaintext } = await jose.compactDecrypt(fileContent, secretKey);
						const decryptedJson = new TextDecoder().decode(plaintext);
						resourceData = JSON.parse(decryptedJson);
					} else {
						resourceData = JSON.parse(fileContent);
					}
					const shouldStop = processResourceData(resourceData, upload, cid, resourceUrl);
					if (shouldStop) break;
				} catch (error) {
					console.warn(`Could not process resource from upload ${upload.root}:`, error);
				}
			}
		} catch (error) {
			console.warn(`Could not fetch resource from upload ${upload.root}:`, error);
		}
	}

	if (!foundResources.length) {
		return new Response(JSON.stringify({
			error: "Resource not found",
			resourceId,
		}), {
			status: 404,
			headers: { "Content-Type": "application/json" },
		});
	}

	return new Response(JSON.stringify({
		resourceId,
		resources: foundResources,
	}), {
		headers: { "Content-Type": "application/json" },
	});
});

router.get("/websocket", async (request: Request, env: any) => {
	return await env.WORKER_LIVESTORE.fetch(request, env);
});

router.post("/api/iam", async (request: Request, env: any) => {
	const { policies } = await request.json();
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
	const { agentDid, tokenType } = await request.json();

	const policyDO = await getPolicyDO(request, env);

	const policies = await policyDO.getAllPolicies();

	const jwtSecret = await env.GEIST.get("GEIST_JWT_SECRET") || env.DEFAULT_GEIST_JWT_SECRET;

	console.log("auth for user", agentDid);

	if (!agentDid) {
		throw new Error("did is not set");
	}

	const jwt = await authorizeJWT(
		policies,
		{
			subject: agentDid,
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
