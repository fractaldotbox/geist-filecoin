import type { UploadListItem } from "@web3-storage/w3up-client/dist/src/types";
import ky from "ky";

export interface EntryData {
	id: string;
	name: string;
	spaceId: string;
	contentTypeId: string;
	data: string;
	storageProviderKey: string;
	tags: string;
	publishedAt: Date;
}

export interface EntryMetadata {
	name?: string;
	contentTypeId?: string;
	spaceId?: string;
	contentType?: string;
}

export interface EntryIPFSData {
	metadata: EntryMetadata;
	data: {
		[key: string]: unknown;
	};
}

// Fetch metadata from IPFS gateway
export const fetchIPFSMetadata = async (
	cidRootWithGatewayUrl: string,
): Promise<EntryIPFSData> => {
	try {
		const response = await ky
			.get(`${cidRootWithGatewayUrl}/entry.json`)
			.json<EntryIPFSData>();
		return response;
	} catch (error) {
		console.error("Failed to fetch IPFS metadata:", error);
		throw new Error(`Failed to fetch metadata from ${cidRootWithGatewayUrl}`);
	}
};

// We don't have information to infer content type from CID
// decrypt & indexing from data will be necessary
export const inferContentType = (cid: string): string => {
	return "storacha-upload";
};

export const createGatewayUrl = (cid: string): string => {
	return `https://${cid}.ipfs.w3s.link/`;
};

// Create EntryData from IPFS metadata
export const createEntryDataFromIPFS = async (
	spaceId: string,
	upload: UploadListItem,
): Promise<EntryData> => {
	const cid = upload.root.toString();

	const cidRootWithGatewayUrl = createGatewayUrl(cid);
	const { metadata, data } = await fetchIPFSMetadata(cidRootWithGatewayUrl);
	return {
		id: cid,
		spaceId,
		name: metadata.name || "",
		contentTypeId: metadata.contentTypeId || "",
		data: JSON.stringify(data),
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
		data: `Storacha upload with CID: ${cid}`,
		storageProviderKey: spaceId,
		tags: JSON.stringify({
			shards: upload.shards || [],
			// inserted: upload.inserted,
			// updated: upload.updated
		}),
		publishedAt: new Date(upload.insertedAt),
	};
};
