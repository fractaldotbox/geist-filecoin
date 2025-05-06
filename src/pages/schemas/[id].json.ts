export const prender = false;

import type { APIRoute } from "astro";
import { getSchemaWithId } from "./schema-loader";

// TODO use storage with cloudflare kv

export const GET: APIRoute = async ({ params }) => {
	const schema = await getSchemaWithId(params.id as string);

	if (!schema) {
		return new Response(JSON.stringify({ error: "Schema not found" }), {
			status: 404,
			headers: {
				"Content-Type": "application/json",
			},
		});
	}

	return new Response(JSON.stringify(schema), {
		headers: {
			"Content-Type": "application/json",
		},
	});
};
