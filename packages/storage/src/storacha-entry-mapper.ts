import type { UploadListItem } from "@web3-storage/w3up-client/dist/src/types";
import ky from "ky";

export interface EntryData {
	id: string;
	spaceId: string;
	contentTypeId: string;
	title: string;
	content: string;
	mediaType: string;
	mediaUrl: string;
	mediaCid: string;
	storageProviderKey: string;
	tags: string;
	publishedAt: Date;
}

export interface EntryMetadata {
    name?: string;
    description?: string;
    image?: string;
    attributes?: Array<{
        trait_type: string;
        value: string | number;
    }>;
}

export interface IPFSMetadata {
	name?: string;
	description?: string;
	image?: string;
	attributes?: Array<{
		trait_type: string;
		value: string | number;
	}>;
    data:{
        [key: string]: unknown;
    }

}

// Infer content type based on CID or file extension
const inferContentType = (cid: string): string => {
	// This is a simple implementation - in a real scenario, you might want to
	// inspect the actual content or use a more sophisticated method
	return "ipfs-upload";
};

// Fetch metadata from IPFS gateway
export const fetchIPFSMetadata = async (cidRootWithGatewayUrl: string): Promise<IPFSMetadata> => {
	try {
		const response = await ky.get(`${cidRootWithGatewayUrl}/metadata.json`).json<IPFSMetadata>();
		return response;
	} catch (error) {
		console.error("Failed to fetch IPFS metadata:", error);
		throw new Error(`Failed to fetch metadata from ${cidRootWithGatewayUrl}/metadata.json`);
	}
};

// Create EntryData from IPFS metadata
export const createEntryDataFromIPFS = async (
	spaceId: string,
	upload: UploadListItem,
	gatewayUrl: string,
): Promise<EntryData> => {
	const cid = upload.root.toString();
	const data = await fetchIPFSMetadata(gatewayUrl);

    const { name, description, image, attributes } = data;

	return {
		id: cid,
		spaceId,
		contentTypeId: inferContentType(cid),
		title: metadata.name || `Upload ${cid}`,
		content: metadata.description || `Storacha upload with CID: ${cid}`,
		mediaType: metadata.image ? "image/*" : "application/octet-stream",
		mediaUrl: metadata.image || "",
		mediaCid: cid,
		storageProviderKey: spaceId,
		tags: JSON.stringify({
			shards: upload.shards || [],
			metadata: metadata,
		}),
		publishedAt: new Date(upload.insertedAt),
	};
};

// with content addressing nature, entry id will change per content
export const createEntryData = (
	spaceId: string,
	upload: UploadListItem,
): EntryData => {
	const cid = upload.root.toString();

	return {
		id: cid, // Use the CID as the unique identifier
		spaceId,
		contentTypeId: inferContentType(cid),
		title: `Upload ${upload.root}`, // Generate a title from the CID
		content: `Storacha upload with CID: ${cid}`,
		mediaType: "application/octet-stream", // Default media type
		// mediaUrl: getGatewayUrl(upload.root),
		mediaUrl: "",
		mediaCid: cid, // Use the CID as mediaCid
		storageProviderKey: spaceId,
		tags: JSON.stringify({
			shards: upload.shards || [],
			// inserted: upload.inserted,
			// updated: upload.updated
		}),
		publishedAt: new Date(upload.insertedAt),
	};
};