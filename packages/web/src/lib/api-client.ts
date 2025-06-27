import ky, { type KyInstance } from "ky";

const API_BASE_URL =
	import.meta.env.VITE_LIVESTORE_SYNC_URL || "http://localhost:8787";

// Create base ky instance with common configuration
export const apiClient: KyInstance = ky.create({
	prefixUrl: API_BASE_URL,
	timeout: 30000, // 30 seconds
	retry: {
		limit: 2,
		methods: ["get", "post"],
		statusCodes: [408, 413, 429, 500, 502, 503, 504],
	},
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
	requestDelegation: async (did: string): Promise<ArrayBuffer> => {
		return apiClient
			.post("api/auth", {
				json: { did },
			})
			.arrayBuffer();
	},
} as const;

// Upload endpoints
export const upload = {
	/**
	 * Upload a file
	 */
	uploadFile: async (file: File): Promise<{ url: string; cid: string }> => {
		const formData = new FormData();
		formData.append("file", file);

		return apiClient
			.post("api/upload", {
				body: formData,
			})
			.json();
	},
} as const;

// Export the main client and organized endpoints
export default {
	auth,
	upload,
	client: apiClient,
};
