import { useLiveStore } from "@/components/react/hooks/useLiveStore";
import type { Space } from "@/domain/space";
import { allEntries$ } from "@/livestore/queries";
import { createEntryDataFromIPFS, listFiles } from "@geist-filecoin/storage";
/**
 * now sync from client side, after client receive delegations
 * although possible to setup server side sync to livestore
 *
 * TODO use https://effect.website/docs/getting-started/building-pipelines/
 */
import { useStore } from "@livestore/react";
import type { UploadListItem } from "@w3ui/react";
import type { Client } from "@storacha/client";
import type { DID as W3DID } from "@storacha/client/principal/ed25519";
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

// Pure function to fetch all uploads from a space
export const fetchSpaceUploads = async (
	client: Client,
	spaceDid: W3DID,
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

// Pure function to determine if upload is recent
export const isRecentUpload = (
	uploadDate: Date,
	daysThreshold = 7,
): boolean => {
	return (
		Date.now() - uploadDate.getTime() < daysThreshold * 24 * 60 * 60 * 1000
	);
};

// Pure function to check if entry exists
export const findExistingEntry = <T extends { id: string }>(
	entries: readonly T[],
	entryId: string,
): T | undefined => {
	return entries.find((entry) => entry.id === entryId);
};

// either query data cut off or just always try to create new entries
export const useSync = (spaceId: string) => {
	const { createEntry, updateEntry } = useLiveStore();
	const { store } = useStore();

	// Move the hook call to the top level
	const allEntries = store.useQuery(allEntries$);

	const sync = async (uploads: UploadListItem[]) => {
		if (!spaceId) {
			return;
		}

		console.log("syncing", spaceId, "storacha files", uploads.length);

		for await (const upload of uploads) {
			const entry = await createEntryDataFromIPFS(spaceId, upload);

			// Check if entry already exists
			const existingEntry = findExistingEntry(allEntries, entry.id);

			if (existingEntry) {
				console.log("entry already exists, skipping", entry.id);
				continue;
			}

			console.log("creating entry", entry.id);
			await createEntry({
				...entry,
				name: entry.name,
				publishedAt: entry.publishedAt.toISOString(),
			});
		}
	};

	return {
		sync,
	};
};
