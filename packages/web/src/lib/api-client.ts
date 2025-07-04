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
		did,
		tokenType,
	}: {
		spaceId: string;
		did: string;
		tokenType: string;
	}): Promise<ArrayBuffer> => {
		return apiClient
			.post("api/auth/ucan", {
				json: { spaceId, did, tokenType },
			})
			.arrayBuffer();
	},
	authorizeJWT: async ({
		spaceId,
		did,
		tokenType,
	}: {
		spaceId: string;
		did: string;
		tokenType: string;
	}): Promise<ArrayBuffer> => {
		return apiClient
			.post("api/auth/jwt", {
				json: { spaceId, did, tokenType },
			})
			.arrayBuffer();
	},
} as const;

// Export the main client and organized endpoints
export default {
	auth,
	client: apiClient,
};
