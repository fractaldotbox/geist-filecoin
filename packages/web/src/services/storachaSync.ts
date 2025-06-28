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
	isActive: number;
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

// Pure function to create entry data from upload
export const createEntryData = (space: Space, upload: StorachaUpload): EntryData => {
	const entryId = `storacha-${upload.root}`;
	const uploadDate = new Date(upload.inserted);
	const isRecent = isRecentUpload(uploadDate);

	return {
		id: entryId,
		spaceId: space.id,
		contentTypeId: inferContentType(upload.root),
		title: `Upload ${upload.root.substring(0, 8)}...`,
		content: `Storacha upload from ${space.name}`,
		mediaType: "application/octet-stream",
		mediaUrl: `https://w3s.link/ipfs/${upload.root}`,
		mediaCid: upload.root,
		storageProviderKey: upload.root,
		tags: JSON.stringify(["storacha", "sync", ...(isRecent ? ["recent"] : [])]),
		publishedAt: uploadDate,
	};
};

// Pure function to check if entry exists
export const findExistingEntry = (entries: any[], entryId: string): any | undefined => {
	return entries.find((entry: any) => entry.id === entryId);
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
		const existingEntries = store.read().entries || [];

		// Process each upload
		const processPromises = uploads.map(async (upload) => {
			const entryData = createEntryData(space, upload);
			const existingEntry = findExistingEntry(existingEntries, entryData.id);

			if (existingEntry) {
				await commitEntryUpdated(store, entryData);
			} else {
				await commitEntryCreated(store, entryData);
			}
		});

		// Process all uploads in parallel
		await Promise.all(processPromises);

	} catch (error) {
		console.error(`Error syncing space ${space.name}:`, error);
		throw error; // Re-throw to allow caller to handle
	}
};



// Utility function to get IPFS gateway URL
export const getGatewayUrl = (cid: string): string => {
	return `https://w3s.link/ipfs/${cid}`;
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
			getGatewayUrl,
		};
	}

	const config: SyncConfig = { client, store };

	return {
		syncAllSpaces: () => syncAllSpaces(config),
		syncSpace: (space: Space) => syncSpace(config, space),
		getGatewayUrl,
	};
}; 