import type { UploadListItem } from "@web3-storage/w3up-client/dist/src/types";
import { beforeEach, describe, expect, it, vi } from "vitest";
import {
	createEntryDataFromIPFS,
	fetchIPFSMetadata,
} from "./storacha-entry-mapper";

// Mock ky
vi.mock("ky", () => ({
	default: {
		get: vi.fn(),
	},
}));

describe("storacha-entry-mapper", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	describe("fetchIPFSMetadata", () => {
		it("should fetch metadata successfully from IPFS gateway", async () => {
			const mockMetadata: any = {
				name: "Test NFT",
				description: "A test NFT with metadata",
				image:
					"ipfs://bafybeib7lhcwh3hvj2h7kiaqstxqnysnjl7hmibzx72zbni4wzhht4vkuu/fuji1.jpg",
				attributes: [
					{ trait_type: "Color", value: "Blue" },
					{ trait_type: "Size", value: "Large" },
				],
			};

			const { default: ky } = await import("ky");
			const mockKyGet = vi.mocked(ky.get);
			mockKyGet.mockResolvedValue({
				json: vi.fn().mockResolvedValue(mockMetadata),
			} as any);

			const gatewayUrl =
				"https://bafybeib7lhcwh3hvj2h7kiaqstxqnysnjl7hmibzx72zbni4wzhht4vkuu.ipfs.w3s.link";
			const result = await fetchIPFSMetadata(gatewayUrl);

			expect(mockKyGet).toHaveBeenCalledWith(`${gatewayUrl}/entry.json`);
			expect(result).toEqual(mockMetadata);
		});

		it("should throw error when metadata fetch fails", async () => {
			const error = new Error("Network error");
			const { default: ky } = await import("ky");
			const mockKyGet = vi.mocked(ky.get);
			mockKyGet.mockRejectedValue(error);

			const cidRootWithGatewayUrl = "https://invalid-gateway.ipfs.w3s.link";

			await expect(fetchIPFSMetadata(cidRootWithGatewayUrl)).rejects.toThrow(
				"Failed to fetch metadata",
			);
		});
	});

	describe("createEntryDataFromIPFS", () => {
		it("should create EntryData from IPFS metadata", async () => {
			const mockMetadata: any = {
				name: "Mountain View",
				description: "Beautiful mountain landscape",
				image:
					"ipfs://bafybeib7lhcwh3hvj2h7kiaqstxqnysnjl7hmibzx72zbni4wzhht4vkuu/fuji1.jpg",
			};

			const { default: ky } = await import("ky");
			const mockKyGet = vi.mocked(ky.get);
			mockKyGet.mockResolvedValue({
				json: vi.fn().mockResolvedValue(mockMetadata),
			} as any);

			const mockUpload = {
				root: "bafybeib7lhcwh3hvj2h7kiaqstxqnysnjl7hmibzx72zbni4wzhht4v4kuu",
				shards: ["shard1", "shard2"],
				insertedAt: "2024-01-01T00:00:00.000Z",
				updatedAt: "2024-01-01T00:00:00.000Z",
			} as unknown as UploadListItem;

			const spaceId = "test-space-id";

			const result = await createEntryDataFromIPFS(spaceId, mockUpload);

			expect(result).toEqual({
				id: "bafybeib7lhcwh3hvj2h7kiaqstxqnysnjl7hmibzx72zbni4wzhht4v4kuu",
				spaceId: "test-space-id",
				contentTypeId: "",
				title: "Mountain View",
				content: "Beautiful mountain landscape",
				storageProviderKey: "test-space-id",
				tags: JSON.stringify({
					shards: ["shard1", "shard2"],
					metadata: mockMetadata,
				}),
				publishedAt: new Date("2024-01-01T00:00:00.000Z"),
			});
		});

		it("should create EntryData with fallback values when metadata is minimal", async () => {
			const mockMetadata: any = {};

			const { default: ky } = await import("ky");
			const mockKyGet = vi.mocked(ky.get);
			mockKyGet.mockResolvedValue({
				json: vi.fn().mockResolvedValue(mockMetadata),
			} as any);

			const mockUpload = {
				root: "bafybeib7lhcwh3hvj2h7kiaqstxqnysnjl7hmibzx72zbni4wzhht4v4kuu",
				shards: [],
				insertedAt: "2024-01-01T00:00:00.000Z",
				updatedAt: "2024-01-01T00:00:00.000Z",
			} as unknown as UploadListItem;

			const spaceId = "test-space-id";
			const gatewayUrl = "https://test-gateway.ipfs.w3s.link";

			const result = await createEntryDataFromIPFS(spaceId, mockUpload);

			expect(result.name).toContain(
				"Upload bafybeib7lhcwh3hvj2h7kiaqstxqnysnjl7hmibzx72zbni4wzhht4v4kuu",
			);
		});
	});
});
