import type { StorageProviderCredentialConfig } from "@/lib/storage-provider";
import { useStore } from "@livestore/react";
import { events } from "../../../livestore/schema";

export const useSpaceStore = () => {
	const { store } = useStore();

	const createSpace = (spaceData: {
		id: string;
		name: string;
		description: string;
		storageProvider: string;
		storageProviderId: string;
		storageProviderCredentials: StorageProviderCredentialConfig[];
	}) => {
		return store.commit(
			events.spaceCreated({
				id: spaceData.id,
				name: spaceData.name,
				description: spaceData.description,
				storageProvider: spaceData.storageProvider,
				storageProviderId: spaceData.storageProviderId,
				storageProviderCredentials:
					JSON.stringify(spaceData.storageProviderCredentials) || "",
			}),
		);
	};

	const updateSpace = (
		id: string,
		spaceData: {
			name: string;
			description: string;
			storageProvider: string;
			storageProviderId: string;
			storageProviderCredentials: StorageProviderCredentialConfig[];
		},
	) => {
		return store.commit(
			events.spaceUpdated({
				id,
				name: spaceData.name,
				description: spaceData.description,
				storageProvider: spaceData.storageProvider,
				storageProviderId: spaceData.storageProviderId,
				storageProviderCredentials:
					JSON.stringify(spaceData.storageProviderCredentials) || "",
			}),
		);
	};

	const deleteSpace = (id: string) => {
		return store.commit(
			events.spaceDeleted({
				id,
				deletedAt: new Date(),
			}),
		);
	};

	return {
		store,
		createSpace,
		updateSpace,
		deleteSpace,
	};
};
