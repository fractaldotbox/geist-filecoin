export const prender = false;

import type { APIRoute } from "astro";
import { getSchemaById } from "./schema-loader";

// TODO use storage with cloudflare kv

export const GET: APIRoute = ({ params }) => {
	const schema = getSchemaById(params.id as string);
	
	if (!schema) {
		return new Response(JSON.stringify({ error: "Schema not found" }), {
			status: 404,
			headers: {
				"Content-Type": "application/json"
			}
		});
	}

	return new Response(JSON.stringify(schema), {
		headers: {
			"Content-Type": "application/json"
		}
	});
}
