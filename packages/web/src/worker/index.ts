import { makeDurableObject, makeWorker } from '@livestore/sync-cf/cf-worker'

export class WebSocketServer extends makeDurableObject({
  onPush: async (message) => {
    console.log('onPush', message.batch)
  },
  onPull: async (message) => {
    console.log('onPull', message)
  },
}) {}

export default makeWorker({
  validatePayload: (payload: any) => {
    if (payload?.authToken !== 'insecure-token-change-me') {
      throw new Error('Invalid auth token')
    }
  },
  enableCORS: true,
})

// Available schema templates
export const SCHEMA_TEMPLATES = ["blog", "landing", "product"] as const;
export type SchemaTemplate = (typeof SCHEMA_TEMPLATES)[number];

interface Env {
	// If you have bindings in wrangler.toml, you can define them here
}

export default {
	async fetch(
		request: Request,
		env: Env,
		ctx: ExecutionContext,
	): Promise<Response> {
		const url = new URL(request.url);

		if (url.pathname === "/api/schemas") {
			try {
				const allSchemas = await Promise.all(
					SCHEMA_TEMPLATES.map((template) =>
						import(`../schemas/${template}.json`).then((m) => [template, m.default]),
					),
				);
				const schemasRecord = Object.fromEntries(allSchemas);
				return Response.json(schemasRecord);
			} catch (error) {
				console.error("Failed to load all schemas:", error);
				return Response.json(
					{ success: false, message: "Failed to load all schemas" },
					{ status: 500 },
				);
			}
		}

		if (url.pathname.startsWith("/api/schemas/")) {
			const template = url.pathname.split("/").pop() as SchemaTemplate;
			if (!template || !SCHEMA_TEMPLATES.includes(template)) {
				return Response.json(
					{ success: false, message: "Invalid schema template" },
					{ status: 404 },
				);
			}

			try {
				const schemaModule = await import(`../schemas/${template}.json`);
				return Response.json(schemaModule.default);
			} catch (error) {
				console.error(`Failed to load schema template "${template}":`, error);
				return Response.json(
					{ success: false, message: `Schema not found: ${template}` },
					{ status: 500 },
				);
			}
		}

		return new Response("Not Found", { status: 404 });
	},
};
