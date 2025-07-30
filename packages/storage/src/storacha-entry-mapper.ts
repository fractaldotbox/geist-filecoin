import type { Entry } from "@geist-filecoin/domain";
import type { UploadListItem } from "@storacha/client/types";
import ky from "ky";

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

export const createEntryDataFromIPFS = async (
	spaceId: string,
	upload: UploadListItem,
): Promise<Entry> => {
	const cid = upload.root.toString();

	const cidRootWithGatewayUrl = createGatewayUrl(cid);
	const { metadata, data } = await fetchIPFSMetadata(cidRootWithGatewayUrl);
	return {
		id: cid,
		spaceId,
		name: metadata.name || "",
		contentTypeId: metadata.contentTypeId || "",
		data,
		storageProviderKey: spaceId,
		storageProviderMetadata: {
			cid,
		},
		tags: {
			shards: upload.shards || [],
			metadata: metadata,
		},
		publishedAt: new Date(upload.insertedAt),
	};
};
