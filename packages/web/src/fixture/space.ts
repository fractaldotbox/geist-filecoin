import { StorageProvider } from "@/constants/storage-providers";
import type { StorageProviderCredentialConfig } from "@/lib/storage-provider";

// Sample space configurations for different use cases
export const SAMPLE_SPACES = [
	{
		id: "demo-space",
		name: "Demo Space",
		description: "A demo space for blog content using Storacha storage",
		storageProvider: StorageProvider.Storacha,
		storageProviderId:
			"did:key:z6Mkvu57pm2XaQYr28RAxRnMZmp8owcf2EtD7MT8FsMVxCnj",
		storageProviderCredentials: [
			{
				type: "secret-ref",
				key: "serverAgentKey",
				valueFrom: "agentKey",
			},
			{
				type: "secret-ref",
				key: "spaceProof",
				valueFrom: "spaceProof",
			},
		] as StorageProviderCredentialConfig[],
	},
] as const;
