import { SAMPLE_SPACES } from "@geist-filecoin/domain/fixture/space";
import { useStore } from "@livestore/react";
import { useSpaceStore } from "@/components/react/hooks/useSpaceStore";
import { allSpaces$ } from "@/livestore/queries";

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
