import { SAMPLE_SPACES } from "@/fixture/space";
import type { DID as W3DID } from "@web3-storage/w3up-client/principal/ed25519";
import { describe, expect, it } from "vitest";
import { StorageProvider } from "../constants/storage-providers";
import { createEntryData } from "./storachaSync";

const mockSpace = SAMPLE_SPACES[0];

const mockStorachaUpload = {
	root: "bafybeigdyrzt5sfp7udm7hu76uh7y26nf3efuylqabf3oclgtqy55fbzdi",
	shards: [
		"bafybeigdyrzt5sfp7udm7hu76uh7y26nf3efuylqabf3oclgtqy55fbzdi-shard-1",
		"bafybeigdyrzt5sfp7udm7hu76uh7y26nf3efuylqabf3oclgtqy55fbzdi-shard-2",
	],
	inserted: "2024-01-15T10:30:00.000Z",
	updated: "2024-01-15T10:30:00.000Z",
};

const mockStorachaUploadWithoutShards = {
	root: "bafybeigdyrzt5sfp7udm7hu76uh7y26nf3efuylqabf3oclgtqy55fbzdi",
	inserted: "2024-01-15T10:30:00.000Z",
	updated: "2024-01-15T10:30:00.000Z",
};

const mockSpaceWithDifferentProvider = {
	id: "space-456",
	name: "S3 Space",
	storageProvider: StorageProvider.S3,
	deletedAt: null,
};

describe("createEntryData", () => {
	describe("with valid inputs", () => {
		it("should create entry data with all required fields", () => {
			const result = createEntryData(mockSpace, mockStorachaUpload);

			expect(result).toEqual({
				id: mockStorachaUpload.root,
				spaceId: mockSpace.id,
				contentTypeId: "storacha-upload",
				title: `Upload ${mockStorachaUpload.root}`,
				content: `Storacha upload with CID: ${mockStorachaUpload.root}`,
				mediaType: "application/octet-stream",
				mediaUrl: "",
				mediaCid: mockStorachaUpload.root,
				storageProviderKey: StorageProvider.Storacha,
				tags: JSON.stringify({
					shards: mockStorachaUpload.shards,
					inserted: mockStorachaUpload.inserted,
					updated: mockStorachaUpload.updated,
				}),
				publishedAt: new Date(mockStorachaUpload.inserted),
			});
		});

		it("should handle upload without shards", () => {
			const result = createEntryData(
				mockSpace,
				mockStorachaUploadWithoutShards,
			);

			expect(result.id).toBe(mockStorachaUploadWithoutShards.root);
			expect(result.mediaCid).toBe(mockStorachaUploadWithoutShards.root);
			expect(result.storageProviderKey).toBe(StorageProvider.Storacha);

			const tags = JSON.parse(result.tags);
			expect(tags.shards).toEqual([]);
			expect(tags.inserted).toBe(mockStorachaUploadWithoutShards.inserted);
			expect(tags.updated).toBe(mockStorachaUploadWithoutShards.updated);
		});

		it("should use space storage provider regardless of space provider", () => {
			const result = createEntryData(
				mockSpaceWithDifferentProvider,
				mockStorachaUpload,
			);

			expect(result.storageProviderKey).toBe(StorageProvider.Storacha);
			expect(result.spaceId).toBe(mockSpaceWithDifferentProvider.id);
		});

		it("should generate correct title from CID", () => {
			const result = createEntryData(mockSpace, mockStorachaUpload);

			expect(result.title).toBe(`Upload ${mockStorachaUpload.root}`);
		});

		it("should generate correct content from CID", () => {
			const result = createEntryData(mockSpace, mockStorachaUpload);

			expect(result.content).toBe(
				`Storacha upload with CID: ${mockStorachaUpload.root}`,
			);
		});

		it("should set correct media type", () => {
			const result = createEntryData(mockSpace, mockStorachaUpload);

			expect(result.mediaType).toBe("application/octet-stream");
		});

		it("should set empty media URL", () => {
			const result = createEntryData(mockSpace, mockStorachaUpload);

			expect(result.mediaUrl).toBe("");
		});

		it("should parse and stringify tags correctly", () => {
			const result = createEntryData(mockSpace, mockStorachaUpload);

			const parsedTags = JSON.parse(result.tags);
			expect(parsedTags).toEqual({
				shards: mockStorachaUpload.shards,
				inserted: mockStorachaUpload.inserted,
				updated: mockStorachaUpload.updated,
			});
		});

		it("should create correct published date from inserted timestamp", () => {
			const result = createEntryData(mockSpace, mockStorachaUpload);

			expect(result.publishedAt).toEqual(new Date(mockStorachaUpload.inserted));
		});
	});

	describe("with different CID formats", () => {
		it("should handle short CID", () => {
			const shortUpload = {
				...mockStorachaUpload,
				root: "bafybeigdyrzt5sfp7udm7hu76uh7y26nf3efuylqabf3oclgtqy55fbzdi",
			};

			const result = createEntryData(mockSpace, shortUpload);

			expect(result.id).toBe(shortUpload.root);
			expect(result.title).toBe(`Upload ${shortUpload.root}`);
			expect(result.content).toBe(
				`Storacha upload with CID: ${shortUpload.root}`,
			);
		});

		it("should handle long CID", () => {
			const longUpload = {
				...mockStorachaUpload,
				root: "bafybeigdyrzt5sfp7udm7hu76uh7y26nf3efuylqabf3oclgtqy55fbzdi-very-long-cid-for-testing-purposes",
			};

			const result = createEntryData(mockSpace, longUpload);

			expect(result.id).toBe(longUpload.root);
			expect(result.title).toBe(`Upload ${longUpload.root}`);
			expect(result.content).toBe(
				`Storacha upload with CID: ${longUpload.root}`,
			);
		});
	});

	describe("with different timestamp formats", () => {
		it("should handle ISO timestamp with milliseconds", () => {
			const uploadWithMs = {
				...mockStorachaUpload,
				inserted: "2024-01-15T10:30:00.123Z",
				updated: "2024-01-15T10:30:00.456Z",
			};

			const result = createEntryData(mockSpace, uploadWithMs);

			expect(result.publishedAt).toEqual(new Date("2024-01-15T10:30:00.123Z"));
		});

		it("should handle timestamp without timezone", () => {
			const uploadWithoutTz = {
				...mockStorachaUpload,
				inserted: "2024-01-15T10:30:00",
				updated: "2024-01-15T10:30:00",
			};

			const result = createEntryData(mockSpace, uploadWithoutTz);

			expect(result.publishedAt).toEqual(new Date("2024-01-15T10:30:00"));
		});
	});

	describe("return type validation", () => {
		it("should return object with correct structure", () => {
			const result = createEntryData(mockSpace, mockStorachaUpload);

			expect(typeof result.id).toBe("string");
			expect(typeof result.spaceId).toBe("string");
			expect(typeof result.contentTypeId).toBe("string");
			expect(typeof result.title).toBe("string");
			expect(typeof result.content).toBe("string");
			expect(typeof result.mediaType).toBe("string");
			expect(typeof result.mediaUrl).toBe("string");
			expect(typeof result.mediaCid).toBe("string");
			expect(typeof result.storageProviderKey).toBe("string");
			expect(typeof result.tags).toBe("string");
			expect(result.publishedAt).toBeInstanceOf(Date);
		});

		it("should have all required fields", () => {
			const result = createEntryData(mockSpace, mockStorachaUpload);

			const requiredFields = [
				"id",
				"spaceId",
				"contentTypeId",
				"title",
				"content",
				"mediaType",
				"mediaUrl",
				"mediaCid",
				"storageProviderKey",
				"tags",
				"publishedAt",
			];

			for (const field of requiredFields) {
				expect(result).toHaveProperty(field);
			}
		});
	});
});
