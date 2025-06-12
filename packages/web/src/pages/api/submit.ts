import { uploadText } from "@/lib/filecoin/lighthouse/isomorphic";
import type { APIRoute } from "astro";

const apiKey = import.meta.env.LIGHTHOUSE_API_KEY;

export const POST: APIRoute = async ({ request }) => {
	try {
		const data = await request.json();

		console.log("data", data);
		const response = await uploadText(JSON.stringify(data), apiKey);

		return new Response(
			JSON.stringify({
				success: true,
				cid: response.cid,
				url: `https://gateway.lighthouse.storage/ipfs/${response.cid}`,
				name: response.name,
				size: response.size,
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
