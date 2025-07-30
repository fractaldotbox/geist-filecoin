import {
	type MockedFunction,
	beforeEach,
	describe,
	expect,
	it,
	vi,
} from "vitest";
import {
	type DelegationFlowParams,
	type StorachaConfig,
	createUserDelegation,
	listAllFiles,
} from "./storacha";

describe("createUserDelegation", () => {
	const userDid =
		"did:key:z4MXj1wBzi9jUstyQoLeoP34wjiR99RYNxg83VfPkkMo1zSbZidnjv1k2zoQmYBKznvzjx1YvFXNGTTy18FXiuJRHSPvjypasT4JLsiQHepPVPCFtFFEZHjaPMwKcj4FhQX3quNwmePpDxNtqScrhSSzq1i4WvYhLdNDdT3ZM1dnv5LBhzwj1NY5wJ48gmxz59TSk25hxCkR9rAtRef83Go1rEYP5GzNbqNXQzpehGT2tFo7EvT2MedybzZKSk8FB7xoukMLhRPJWfTY4A5b3oXD5B9pZv2N3pXSU8LagLTgGwYxF6ZFWugT8CupN7rj3eFuvQd6hFeFAHPa3Uu4irFaiqKpF1PdY5WsPWTufxnmVDhBmUz8p";

	it.skip("delegate space issued by others", async () => {
		const params: DelegationFlowParams = {
			userDid,
			serverAgentKeyString: "",
			proofString: "",
		};

		const { space, delegation } = await createUserDelegation(params);
		expect(space.did()).toEqual(
			"did:key:z6Mkvu57pm2XaQYr28RAxRnMZmp8owcf2EtD7MT8FsMVxCnj",
		);
	});
});

describe("listAllFiles", () => {
	let mockClient: any;
	let mockConfig: StorachaConfig;

	beforeEach(() => {
		mockClient = {
			setCurrentSpace: vi.fn(),
			capability: {
				upload: {
					list: vi.fn(),
				},
			},
		};
		mockConfig = {
			client: mockClient,
			spaceDid:
				"did:key:z6Mkvu57pm2XaQYr28RAxRnMZmp8owcf2EtD7MT8FsMVxCnj" as any,
		};
	});

	it("should return all files when no pagination needed", async () => {
		const mockFiles = [
			{
				root: "file1",
				inserted: "2023-01-01T00:00:00Z",
				updated: "2023-01-01T00:00:00Z",
			},
			{
				root: "file2",
				inserted: "2023-01-02T00:00:00Z",
				updated: "2023-01-02T00:00:00Z",
			},
		];

		mockClient.capability.upload.list.mockResolvedValue({
			results: mockFiles,
			cursor: "", // Empty cursor means no more pages
		});

		const result = await listAllFiles(mockConfig);

		expect(mockClient.setCurrentSpace).toHaveBeenCalledWith(
			mockConfig.spaceDid,
		);
		expect(mockClient.capability.upload.list).toHaveBeenCalledWith({
			cursor: "",
			size: 25,
		});
		expect(result).toEqual(mockFiles);
	});

	it("should paginate through multiple pages and return all files", async () => {
		const page1Files = [
			{
				root: "file1",
				inserted: "2023-01-01T00:00:00Z",
				updated: "2023-01-01T00:00:00Z",
			},
			{
				root: "file2",
				inserted: "2023-01-02T00:00:00Z",
				updated: "2023-01-02T00:00:00Z",
			},
		];
		const page2Files = [
			{
				root: "file3",
				inserted: "2023-01-03T00:00:00Z",
				updated: "2023-01-03T00:00:00Z",
			},
			{
				root: "file4",
				inserted: "2023-01-04T00:00:00Z",
				updated: "2023-01-04T00:00:00Z",
			},
		];

		mockClient.capability.upload.list
			.mockResolvedValueOnce({
				results: page1Files,
				cursor: "page2cursor",
			})
			.mockResolvedValueOnce({
				results: page2Files,
				cursor: "", // Empty cursor means no more pages
			});

		const result = await listAllFiles(mockConfig);

		expect(mockClient.setCurrentSpace).toHaveBeenCalledWith(
			mockConfig.spaceDid,
		);
		expect(mockClient.capability.upload.list).toHaveBeenCalledTimes(2);
		expect(mockClient.capability.upload.list).toHaveBeenNthCalledWith(1, {
			cursor: "",
			size: 25,
		});
		expect(mockClient.capability.upload.list).toHaveBeenNthCalledWith(2, {
			cursor: "page2cursor",
			size: 25,
		});
		expect(result).toEqual([...page1Files, ...page2Files]);
	});

	it("should handle empty results", async () => {
		mockClient.capability.upload.list.mockResolvedValue({
			results: [],
			cursor: "",
		});

		const result = await listAllFiles(mockConfig);

		expect(mockClient.setCurrentSpace).toHaveBeenCalledWith(
			mockConfig.spaceDid,
		);
		expect(mockClient.capability.upload.list).toHaveBeenCalledWith({
			cursor: "",
			size: 25,
		});
		expect(result).toEqual([]);
	});

	it("should handle undefined cursor", async () => {
		const mockFiles = [
			{
				root: "file1",
				inserted: "2023-01-01T00:00:00Z",
				updated: "2023-01-01T00:00:00Z",
			},
		];

		mockClient.capability.upload.list.mockResolvedValue({
			results: mockFiles,
			cursor: undefined,
		});

		const result = await listAllFiles(mockConfig);

		expect(mockClient.setCurrentSpace).toHaveBeenCalledWith(
			mockConfig.spaceDid,
		);
		expect(mockClient.capability.upload.list).toHaveBeenCalledWith({
			cursor: "",
			size: 25,
		});
		expect(result).toEqual(mockFiles);
	});
});
