import { useLiveStore } from "@/components/react/hooks/useLiveStore";
import { useSpaceStore } from "@/components/react/hooks/useSpaceStore";
import { StorageProvider } from "@/constants/storage-providers";
import { SAMPLE_SPACES } from "@/fixture/space";
import type { StorageProviderCredentialConfig } from "@/lib/storage-provider";
import { allSpaces$ } from "@/livestore/queries";
import { useStore } from "@livestore/react";

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
				storageProviderCredentials,
			}) => {
				// Create storage provider credentials for Storacha

				createSpace({
					id,
					name,
					description,
					storageProvider,
					storageProviderId,
					storageProviderCredentials,
				});
			},
		);
	};

	return { seedSpaces };
}
