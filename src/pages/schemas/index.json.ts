export const prender = false;

import type { APIRoute } from "astro";
import { loadAllSchemaIds } from "./schema-loader";

export const GET: APIRoute = async () => {
	const schemaIds = await loadAllSchemaIds();
	return new Response(
		JSON.stringify({
			schemas: schemaIds,
		}),
		{
			headers: {
				"Content-Type": "application/json",
			},
		},
	);
};
