/**
 * now sync from client side, after client receive delegations
 * although possible to setup server side sync to livestore
 * 
 * TODO use https://effect.website/docs/getting-started/building-pipelines/
 */
import { useStore } from "@livestore/react";
import type { Client } from "@web3-storage/w3up-client";
import type { DID as W3DID } from "@web3-storage/w3up-client/principal/ed25519";
import { listFiles } from "@geist-filecoin/storage";
import { StorageProvider } from "../constants/storage-providers";

interface StorachaUpload {
	root: string; // CID of the upload
	shards?: string[]; // Array of shard CIDs
	inserted: string; // ISO timestamp
	updated: string; // ISO timestamp
}

interface StorachaListResult {
	cursor?: string;
	size: number;
	results: StorachaUpload[];
}

interface SyncConfig {
	client: Client;
	store: any;
}

interface Space {
	id: string;
	name: string;
	spaceProof: W3DID;
	storageProvider: StorageProvider;
	deletedAt?: string | null;
}

interface EntryData {
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

// Pure function to filter active Storacha spaces
export const filterStorachaSpaces = (spaces: Space[]): Space[] => {
	return spaces.filter(
		(space) => 
			space.storageProvider === StorageProvider.Storacha && 
			space.isActive === 1 && 
			!space.deletedAt
	);
};

// Pure function to fetch all uploads from a space
export const fetchSpaceUploads = async (
	client: Client, 
	spaceDid: W3DID
): Promise<StorachaUpload[]> => {
	const config = {
		client,
		spaceDid,
	};

	let allUploads: StorachaUpload[] = [];
	let cursor = "";
	let hasMore = true;

	while (hasMore) {
		const result: StorachaListResult = await listFiles(config);
		allUploads = allUploads.concat(result.results);
		
		if (result.cursor && result.results.length === result.size) {
			cursor = result.cursor;
		} else {
			hasMore = false;
		}
	}

	return allUploads;
};

// Pure function to infer content type from CID
export const inferContentType = (cid: string): string => {
	// For now, return a generic type
	// In the future, we could enhance this by:
	// - Checking file extensions if available
	// - Using IPFS metadata
	// - Pattern matching on CID characteristics
	return "storacha-upload";
};

// Pure function to determine if upload is recent
export const isRecentUpload = (uploadDate: Date, daysThreshold = 7): boolean => {
	return (Date.now() - uploadDate.getTime()) < (daysThreshold * 24 * 60 * 60 * 1000);
};

// Pure function to check if entry exists
export const findExistingEntry = (entries: any[], entryId: string): any | undefined => {
	return entries.find((entry: any) => entry.id === entryId);
};

// Pure function to create entry data from space and upload
export const createEntryData = (space: Space, upload: StorachaUpload): EntryData => {
	return {
		id: upload.root, // Use the CID as the unique identifier
		spaceId: space.id,
		contentTypeId: inferContentType(upload.root),
		title: `Upload ${upload.root}`, // Generate a title from the CID
		content: `Storacha upload with CID: ${upload.root}`,
		mediaType: "application/octet-stream", // Default media type
		// mediaUrl: getGatewayUrl(upload.root),
		mediaUrl: "",
		mediaCid: upload.root,
		storageProviderKey: StorageProvider.Storacha,
		tags: JSON.stringify({ 
			shards: upload.shards || [],
			inserted: upload.inserted,
			updated: upload.updated 
		}),
		publishedAt: new Date(upload.inserted),
	};
};

// Commit function for creating new entries
export const commitEntryCreated = async (store: any, entryData: EntryData): Promise<void> => {
	await store.commit("v1.EntryCreated", entryData);
	console.log(`Created entry: ${entryData.id}`);
};

// Commit function for updating existing entries
export const commitEntryUpdated = async (store: any, entryData: EntryData): Promise<void> => {
	await store.commit("v1.EntryUpdated", entryData);
	console.log(`Updated entry: ${entryData.id}`);
};

// Main sync function for a single space
export const syncSpace = async (config: SyncConfig, space: Space): Promise<void> => {
	const { client, store } = config;

	if (!space.spaceProof) {
		console.warn(`Cannot sync space ${space.id}: missing space proof`);
		return;
	}

	try {
		console.log(`Syncing space: ${space.name} (${space.id})`);

		// Fetch all uploads from the space
		const uploads = await fetchSpaceUploads(client, space.spaceProof);
		console.log(`Found ${uploads.length} uploads in space ${space.name}`);

		// Get existing entries to determine create vs update
		// const existingEntries = store.read().entries || [];

		// // Process each upload
		// const processPromises = uploads.map(async (upload) => {
		// 	const entryData = createEntryData(space, upload);

		// 	await commitEntryUpdated(store, entryData);
		// });

		// // Process all uploads in parallel
		// await Promise.all(processPromises);

	} catch (error) {
		console.error(`Error syncing space ${space.name}:`, error);
		throw error; // Re-throw to allow caller to handle
	}
};

/**
 * Hook to use functional storacha sync operations
 */
export const useStorachaSync = (client: Client | null) => {
	const { store } = useStore();

	if (!client) {
		return {
			syncAllSpaces: async () => {
				console.warn("Storacha client not available");
			},
			syncSpace: async () => {
				console.warn("Storacha client not available");
			},
		};
	}

	const config: SyncConfig = { client, store };

	return {
		syncSpace: (space: Space) => syncSpace(config, space)
	};
}; 