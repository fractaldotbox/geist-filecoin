import { useLiveStore } from "@/components/react/hooks/useLiveStore";
import { useSpaceStore } from "@/components/react/hooks/useSpaceStore";
import { StorageProvider } from "@/constants/storage-providers";
import { allSpaces$ } from "@/livestore/queries";
import { useStore } from "@livestore/react";

// Sample space configurations for different use cases
const SAMPLE_SPACES = [
	{
		id: "demo-space",
		name: "Demo Space",
		description: "A demo space for blog content using Storacha storage",
		storageProvider: StorageProvider.STORACHA,
		spaceKey: "did:key:space",
		spaceProof: "proof-string",
		isActive: false,
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
				spaceKey,
				spaceProof,
				isActive,
			}) => {
				// Create storage provider credentials for Storacha
				const storageProviderCredentials = JSON.stringify({
					spaceKey,
				});

				createSpace({
					id,
					name,
					description,
					storageProvider,
					storageProviderCredentials,
					spaceProof,
					isActive,
				});
			},
		);
	};

	return { seedSpaces };
}
