import type { APIRoute } from "astro";

export const POST: APIRoute = async ({ request }) => {
	try {
		const data = await request.json();

		console.log("data", data);

		return new Response(
			JSON.stringify({
				success: true,
			}),
			{ status: 200 },
		);
	} catch (error) {
		console.error("Error uploading metadata:", error);
		return new Response(
			JSON.stringify({
				error: "Failed to upload metadata",
				message: error instanceof Error ? error.message : "Unknown error",
			}),
			{ status: 500 },
		);
	}
};
