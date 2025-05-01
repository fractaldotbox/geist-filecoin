export const prender = false;

import { readFileSync } from "node:fs";
import { join } from "node:path";

export const blogSchema = JSON.parse(
	readFileSync(join(process.cwd(), "src/pages/schemas/blog.json"), "utf-8"),
);

const productSchema = JSON.parse(
	readFileSync(join(process.cwd(), "src/pages/schemas/product.json"), "utf-8"),
);

const landingSchema = JSON.parse(
	readFileSync(join(process.cwd(), "src/pages/schemas/landing.json"), "utf-8"),
);

// TODO use storage with cloudflare kv

export function GET({ params, request }) {
	const byId = {
		landing: landingSchema,
		product: productSchema,
		blog: blogSchema,
	};

	return new Response(JSON.stringify(byId[params.id]));
}
