import { uploadFiles as uploadFilesLighthouse } from "@/lib/filecoin/lighthouse/isomorphic";
import { uploadFiles } from "@/services/upload-files";
import type { APIRoute } from "astro";

const apiKey = import.meta.env.LIGHTHOUSE_API_KEY;

export const POST: APIRoute = async ({ request }) => {
	console.log("upload endpoint");
	try {
		const formData = await request.formData();
		const file = formData.get("file") as File;

		console.log("file", file);
		if (!file) {
			return new Response(
				JSON.stringify({
					error: "No file provided",
				}),
				{ status: 400 },
			);
		}

		const response = await uploadFiles({
			file,
			uploadProgressCallback: (progress) => {
				console.log("progress", progress);
			},
		});

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
		console.error("Error uploading file:", error);
		return new Response(
			JSON.stringify({
				error: "Failed to upload file",
				message: error instanceof Error ? error.message : "Unknown error",
			}),
			{ status: 500 },
		);
	}
};
