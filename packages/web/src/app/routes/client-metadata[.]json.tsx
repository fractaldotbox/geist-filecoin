import type { RequestHandler } from "@react-router/cloudflare";
import { createClientMetadata } from "../../lib/client-metadata";

export const loader: RequestHandler = async ({
	request,
}: { request: Request }) => {
	const clientMetadata = createClientMetadata();

	return new Response(JSON.stringify(clientMetadata, null, 2), {
		headers: {
			"Content-Type": "application/json",
			"Cache-Control": "public, max-age=300", // 5 minutes cache
		},
	});
};
