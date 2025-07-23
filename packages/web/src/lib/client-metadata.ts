export interface ClientMetadata {
	client_id: string;
	client_name: string;
	client_uri: string;
	redirect_uris: string[];
	grant_types: string[];
	response_types: string[];
	scope: string;
	application_type: string;
	token_endpoint_auth_method: string;
	require_pushed_authorization_requests: boolean;
	dpop_bound_access_tokens: boolean;
	dpop_signing_alg_values_supported: string[];
}

const HOST = import.meta.env.VITE_HOST || "https://tunnel.geist.network";

export function createClientMetadata(baseUrl: string = HOST): ClientMetadata {
	return {
		client_id: `${baseUrl}/client-metadata.json`,
		client_name: "Geist Filecoin",
		client_uri: baseUrl,
		redirect_uris: [`${baseUrl}/auth/callback`],
		grant_types: ["authorization_code", "refresh_token"],
		response_types: ["code"],
		scope: "atproto transition:generic",
		application_type: "web",
		token_endpoint_auth_method: "none",
		require_pushed_authorization_requests: false,
		dpop_bound_access_tokens: true,
		dpop_signing_alg_values_supported: ["ES256", "RS256"],
	};
}
