import { useStore } from "@livestore/react";
import { events } from "../../../livestore/schema";

export const useSpaceStore = () => {
	const { store } = useStore();

	const createSpace = (spaceData: {
		id: string;
		name: string;
		description: string;
		storageProvider: string;
		storageProviderCredentials: string;
		spaceProof: string;
	}) => {
		return store.commit(
			events.spaceCreated({
				id: spaceData.id,
				name: spaceData.name,
				description: spaceData.description,
				storageProvider: spaceData.storageProvider,
				storageProviderCredentials: spaceData.storageProviderCredentials || "",
				spaceProof: spaceData.spaceProof || "",
			}),
		);
	};

	const updateSpace = (
		id: string,
		spaceData: {
			name: string;
			description: string;
			storageProvider: string;
			storageProviderCredentials: string;
			spaceProof: string;
			isActive: boolean;
		},
	) => {
		return store.commit(
			events.spaceUpdated({
				id,
				name: spaceData.name,
				description: spaceData.description,
				storageProvider: spaceData.storageProvider,
				storageProviderCredentials: spaceData.storageProviderCredentials || "",
				spaceProof: spaceData.spaceProof || "",
				isActive: spaceData.isActive,
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