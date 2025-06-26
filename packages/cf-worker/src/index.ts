import { makeDurableObject, makeWorker } from "@livestore/sync-cf/cf-worker";

export class WebSocketServer extends makeDurableObject({
	onPush: async (message) => {
		console.log("onPush", message.batch);
	},
	onPull: async (message) => {
		console.log("onPull", message);
	},
}) {}

const worker = makeWorker({
	validatePayload: (payload: any) => {
		if (payload?.authToken !== "insecure-token-change-me") {
			throw new Error("Invalid auth token");
		}
	},
	enableCORS: true,
});

export default {
	...worker,
	fetch: async (request: Request, env: any, ctx: any) => {
		const url = new URL(request.url);

		// Handle UUID generation route
		if (url.pathname === "/api/uuid") {
			const uuid = crypto.randomUUID();

			return new Response(JSON.stringify({ uuid }), {
				headers: {
					"Content-Type": "application/json",
				},
			});
		}

		// Handle other routes with the original worker
		return worker.fetch(request, env, ctx);
	},
};

// if (url.pathname === '/api/hello') {
//   return new Response('Hello from Cloudflare Worker!');
// }
