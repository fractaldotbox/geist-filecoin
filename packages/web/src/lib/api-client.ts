import type { AccessPolicy } from "@geist-filecoin/auth";
import { DID } from "@w3ui/react";
import ky, { type KyInstance } from "ky";

const API_BASE_URL =
	import.meta.env.VITE_LIVESTORE_SYNC_URL || "http://localhost:8787";

// Create base ky instance with common configuration
export const apiClient: KyInstance = ky.create({
	prefixUrl: API_BASE_URL,
	timeout: 30000, // 30 seconds
	retry: 0,
	headers: {
		"Content-Type": "application/json",
	},
	hooks: {
		beforeRequest: [
			(request) => {
				console.log(`[API] ${request.method.toUpperCase()} ${request.url}`);
			},
		],
		beforeError: [
			(error) => {
				console.error(`[API Error] ${error.name}: ${error.message}`);
				return error;
			},
		],
	},
});

// Auth endpoints
export const auth = {
	authorizeUcan: async ({
		spaceId,
		agentDid,
		accountProof
	}: {
		spaceId: string;
		agentDid: DID;
		accountProof: string
	}): Promise<ArrayBuffer> => {
		return apiClient
			.post("api/auth/ucan", {
				json: { spaceId, agentDid, accountProof },
			})
			.arrayBuffer();
	},
	authorizeJWT: async ({
		did,
	}: {
		did: string;
		tokenType: string;
	}): Promise<any> => {
		return apiClient
			.post("api/auth/jwt", {
				json: { did },
			})
			.json();
	},
	addPolicies: async ({
		policies,
	}: {
		policies: AccessPolicy[];
	}): Promise<any> => {
		return apiClient.post("api/iam", { json: { policies } }).json();
	},
} as const;

// Export the main client and organized endpoints
export default {
	auth,
	client: apiClient,
};
