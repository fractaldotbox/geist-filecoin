import { DurableObject, type DurableObjectId } from "cloudflare:workers";
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
			policyId TEXT PRIMARY KEY,
			criteriaType  TEXT,
			criteria  TEXT,
			access  TEXT
		  )`);
	}

	increment() {}

	async getAllPolicies() {
		this.policies = this.storage.sql.exec("SELECT * FROM policies;").toArray();

		console.log("getAllPolicies", this.policies);

		return this.policies.map((policy: any) => {
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

		await this.storage.sql.exec(
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
	return env.POLICIES.idFromName(new URL(request.url).pathname);
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

	const policyDO = await getPolicyDO(request, env);

	// TODO load policies
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

	if (!resourceId) {
		return new Response(JSON.stringify({ error: "Resource ID is required" }), {
			status: 400,
			headers: { "Content-Type": "application/json" },
		});
	}

	// Get encryption key from environment for decryption
	const encryptionKeyBase64 = await env.ENCRYPTION_KEY.get();
	if (!encryptionKeyBase64) {
		return new Response(JSON.stringify({ error: "Encryption key not configured" }), {
			status: 500,
			headers: { "Content-Type": "application/json" },
		});
	}

	// Convert base64 key to secret key for jose
	const keyBytes = new Uint8Array(Buffer.from(encryptionKeyBase64, 'base64'));
	const secretKey = await jose.importJWK({
		kty: 'oct',
		k: jose.base64url.encode(keyBytes)
	});

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

	const resourceFileName = `${resourceId}.encrypted.json`;
	const foundResources: any[] = [];

	// Fetch resources from newest to oldest uploads
	for (const upload of sortedUploads) {
		try {
			const cid = upload.root.toString();
			const resourceUrl = `${createGatewayUrl(cid)}${resourceFileName}`;
			const response = await fetch(resourceUrl);

			if (response.ok) {
				// The file content is the JWE string directly, not wrapped in JSON
				const jweString = await response.text();
				
				try {
					// Decrypt the JWE using jose
					const { plaintext } = await jose.compactDecrypt(jweString, secretKey);
					const decryptedJson = new TextDecoder().decode(plaintext);
					const decryptedData = JSON.parse(decryptedJson);

					const mode = decryptedData.meta?.mode || 'replace';

					foundResources.push({
						data: decryptedData.data,
						meta: {
							...decryptedData.meta,
							cid,
							updatedAt: upload.updatedAt,
							insertedAt: upload.insertedAt,
							gatewayUrl: resourceUrl,
						},
					});

					// Stop if latestOnly requested or replace mode
					if (version === 'latestOnly' || mode === 'replace') {
						break;
					}
				} catch (decryptError) {
					console.warn(`Could not decrypt resource from upload ${upload.root}:`, decryptError);
					// If decryption fails, skip this resource
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

router.post('/api/encrypt', async (request: Request, env: any) => {
	try {
		const body = await request.json();

		if (!body || (typeof body === 'object' && Object.keys(body).length === 0)) {
			return new Response(JSON.stringify({ error: "Request body is required" }), {
				status: 400,
				headers: { "Content-Type": "application/json" },
			});
		}

		// Get encryption key from environment
		const encryptionKeyBase64 = await env.ENCRYPTION_KEY.get();
		if (!encryptionKeyBase64) {
			return new Response(JSON.stringify({ error: "Encryption key not configured" }), {
				status: 500,
				headers: { "Content-Type": "application/json" },
			});
		}

		// Convert base64 key to secret key for jose
		const keyBytes = new Uint8Array(Buffer.from(encryptionKeyBase64, 'base64'));
		const secretKey = await jose.importJWK({
			kty: 'oct',
			k: jose.base64url.encode(keyBytes)
		});

		// Encrypt using jose CompactEncrypt - encrypt the entire body
		const jwe = await new jose.CompactEncrypt(
			new TextEncoder().encode(JSON.stringify(body))
		)
			.setProtectedHeader({ alg: 'dir', enc: 'A256GCM' })
			.encrypt(secretKey);

		return new Response(JSON.stringify({
			jwe: jwe,
			success: true
		}), {
			headers: { "Content-Type": "application/json" },
		});

	} catch (error) {
		console.error('Encryption error:', error);
		const errorMessage = error instanceof Error ? error.message : "Unknown encryption error";
		return new Response(JSON.stringify({ 
			error: errorMessage,
			success: false
		}), {
			status: 500,
			headers: { "Content-Type": "application/json" },
		});
	}
});

router.post('/api/decrypt', async (request: Request, env: any) => {
	try {
		const body = await request.json();
		const { jwe } = body;

		if (!jwe) {
			return new Response(JSON.stringify({ 
				error: "JWE is required" 
			}), {
				status: 400,
				headers: { "Content-Type": "application/json" },
			});
		}

		// Get encryption key from environment
		const encryptionKeyBase64 = await env.ENCRYPTION_KEY.get();
		if (!encryptionKeyBase64) {
			return new Response(JSON.stringify({ error: "Encryption key not configured" }), {
				status: 500,
				headers: { "Content-Type": "application/json" },
			});
		}

		// Convert base64 key to secret key for jose
		const keyBytes = new Uint8Array(Buffer.from(encryptionKeyBase64, 'base64'));
		const secretKey = await jose.importJWK({
			kty: 'oct',
			k: jose.base64url.encode(keyBytes)
		});

		// Decrypt using jose compactDecrypt
		const { plaintext, protectedHeader } = await jose.compactDecrypt(jwe, secretKey);
		const decryptedData = new TextDecoder().decode(plaintext);

		// Parse the decrypted JSON back to object
		const decryptedBody = JSON.parse(decryptedData);

		return new Response(JSON.stringify({
			data: decryptedBody,
			protectedHeader: protectedHeader,
			success: true
		}), {
			headers: { "Content-Type": "application/json" },
		});

	} catch (error) {
		console.error('Decryption error:', error);
		const errorMessage = error instanceof Error ? error.message : "Unknown decryption error";
		return new Response(JSON.stringify({ 
			error: errorMessage,
			success: false
		}), {
			status: 500,
			headers: { "Content-Type": "application/json" },
		});
	}
});



router.get("/websocket", async (request: Request, env: any) => {
	return await env.WORKER_LIVESTORE.fetch(request, env);
});

router.post("/api/iam", async (request: Request, env: any) => {
	const { policies } = await request.json();
	console.log("iam add policies", policies);
	const id: DurableObjectId = env.POLICIES.idFromName(
		new URL(request.url).pathname,
	);

	const policy = await env.POLICIES.get(id);

	// Add policies with their IDs for upsert functionality
	await policy.addPolicies(policies);

	return new Response(JSON.stringify({ message: "Policies stored" }), {
		headers: {
			"Content-Type": "application/json",
		},
	});
});

router.post("/api/auth/jwt", async (request: Request, env: any) => {
	const { did, tokenType } = await request.json();

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
