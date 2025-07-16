import type { StorachaConfig } from "./storacha";
import { createGatewayUrl } from "./storacha-entry-mapper";
import ky from "ky";

export interface ResourceMapEntry {
	cid: string;
	timestamp?: string;
}

export interface ResourceData {
	resourceId: string;
	entries: ResourceMapEntry[];
	latestEntry?: any;
}

/**
 * Fetches a resource from the current storacha space by resourceId
 * @param config - The storacha configuration containing client and spaceDid
 * @param resourceId - The ID of the resource to fetch (e.g., "landing", "blog")
 * @returns Promise<ResourceData> - The resource data containing the map of CIDs and optionally the latest entry
 */
export const fetchResource = async (
	config: StorachaConfig,
	resourceId: string,
): Promise<ResourceData> => {
	const { client, spaceDid } = config;
	
	// Set the current space
	await client.setCurrentSpace(spaceDid);
	
	// Get all files from the storacha space
	const uploadList = await client.capability.upload.list({ cursor: "", size: 100 });
	
	const resourceEntries: ResourceMapEntry[] = [];
	let latestMapCid: string | null = null;
	let latestTimestamp: Date | null = null;
	
	// Look for {resourceId}_map.json files
	const mapFileName = `${resourceId}_map.encrypted.json`;
	
	for (const upload of uploadList.results) {
		const cid = upload.root.toString();
		const gatewayUrl = createGatewayUrl(cid);
		
		try {
			// Try to fetch the directory listing to check for our target file
			const response = await ky.get(gatewayUrl).text();
			
			// Check if this directory contains our target map file
			if (response.includes(mapFileName)) {
				const uploadTimestamp = new Date(upload.insertedAt);
				
				// Track the latest map file
				if (!latestTimestamp || uploadTimestamp > latestTimestamp) {
					latestTimestamp = uploadTimestamp;
					latestMapCid = cid;
				}
				
				resourceEntries.push({
					cid,
					timestamp: upload.insertedAt,
				});
			}
		} catch (error) {
			// Skip if we can't access this CID
			console.warn(`Could not access CID ${cid}:`, error);
		}
	}
	
	if (resourceEntries.length === 0) {
		throw new Error(`No resource found for resourceId: ${resourceId}`);
	}
	
	// Optionally fetch the latest map file content
	let latestEntry: any = null;
	if (latestMapCid) {
		try {
			const latestMapUrl = `${createGatewayUrl(latestMapCid)}/${mapFileName}`;
			latestEntry = await ky.get(latestMapUrl).json();
		} catch (error) {
			console.warn(`Could not fetch latest map content for ${resourceId}:`, error);
		}
	}
	
	return {
		resourceId,
		entries: resourceEntries.sort((a, b) => 
			new Date(b.timestamp || 0).getTime() - new Date(a.timestamp || 0).getTime()
		),
		latestEntry,
	};
};

/**
 * Fetches the latest encrypted content for a specific resource
 * @param config - The storacha configuration containing client and spaceDid
 * @param resourceId - The ID of the resource to fetch (e.g., "landing", "blog")
 * @returns Promise<any> - The latest encrypted content
 */
export const fetchLatestResourceContent = async (
	config: StorachaConfig,
	resourceId: string,
): Promise<any> => {
	const resource = await fetchResource(config, resourceId);
	
	if (resource.entries.length === 0) {
		throw new Error(`No entries found for resourceId: ${resourceId}`);
	}
	
	const latestEntry = resource.entries[0];
	if (!latestEntry) {
		throw new Error(`No valid entry found for resourceId: ${resourceId}`);
	}
	
	const contentFileName = `${resourceId}.encrypted.json`;
	const contentUrl = `${createGatewayUrl(latestEntry.cid)}/${contentFileName}`;
	
	try {
		return await ky.get(contentUrl).json();
	} catch (error) {
		throw new Error(`Failed to fetch content for ${resourceId}: ${error}`);
	}
};
