export type Entry = {
	id: string;
	spaceId: string;
	contentTypeId: string;
	name: string;
	data: Record<string, unknown>;
	// storage provider key is the name of the storage provider, e.g. "storacha" or "s3"
	storageProviderKey: string;
	// storacha: { cid: string, spaceId: string }
	storageProviderMetadata: Record<string, unknown>;
	tags: Record<string, unknown>;
	publishedAt: Date;
};
