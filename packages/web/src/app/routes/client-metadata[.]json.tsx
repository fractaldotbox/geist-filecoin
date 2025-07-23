import type { RequestHandler } from "@react-router/cloudflare";
import type { Route } from "../+types/root";
import { createClientMetadata } from "../../lib/client-metadata";

export const loader: RequestHandler = async ({ context }: Route.LoaderArgs) => {
	const host =
		(context as any)?.cloudflare?.env?.HOST || "filecoin.geist.network";
	const clientMetadata = createClientMetadata(host);

	return new Response(JSON.stringify(clientMetadata, null, 2), {
		headers: {
			"Content-Type": "application/json",
			"Cache-Control": "public, max-age=300", // 5 minutes cache
		},
	});
};
