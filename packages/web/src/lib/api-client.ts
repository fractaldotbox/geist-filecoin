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
	/**
	 * Request delegation for a DID
	 */
	requestDelegation: async ({
		spaceId,
		did,
	}: {
		spaceId: string;
		did: string;
	}): Promise<ArrayBuffer> => {
		return apiClient
			.post("api/auth", {
				json: { spaceId, did },
			})
			.arrayBuffer();
	},
} as const;

// Export the main client and organized endpoints
export default {
	auth,
	client: apiClient,
};
