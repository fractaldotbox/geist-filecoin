import { useLiveStore } from "@/components/react/hooks/useLiveStore";
import { useSpaceStore } from "@/components/react/hooks/useSpaceStore";
import { StorageProvider } from "@/constants/storage-providers";
import type { StorageProviderCredentialConfig } from "@/lib/storage-provider";
import { allSpaces$ } from "@/livestore/queries";
import { useStore } from "@livestore/react";

// Sample space configurations for different use cases
const SAMPLE_SPACES = [
	{
		id: "demo-space",
		name: "Demo Space",
		description: "A demo space for blog content using Storacha storage",
		storageProvider: StorageProvider.Storacha,
		storageProviderId: "did:key:z6Mkvu57pm2XaQYr28RAxRnMZmp8owcf2EtD7MT8FsMVxCnj",
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
			}
		] as StorageProviderCredentialConfig[],
		isActive: true,
	},
] as const;

export function useSpaceSeeder() {
	const { store } = useStore();
	const { createSpace } = useSpaceStore();
	const existingSpaces = store.useQuery(allSpaces$);

	const seedSpaces = () => {
		if (existingSpaces.length > 0) {
			return;
		}

		SAMPLE_SPACES.map(
			({
				id,
				name,
				description,
				storageProvider,
				storageProviderId,
				storageProviderCredentials
			}) => {
				// Create storage provider credentials for Storacha

				createSpace({
					id,
					name,
					description,
					storageProvider,
					storageProviderId,
					storageProviderCredentials,
					isActive: true,
				});
			},
		);
	};

	return { seedSpaces };
}
