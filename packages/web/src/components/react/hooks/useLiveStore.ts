import { useStore } from "@livestore/react";
import { events } from "../../../livestore/schema";
import type { EntryFormData, FileFieldValue } from "../fields/types";

export const useLiveStore = () => {
	const { store } = useStore();

	const createEntry = (
		entryData: EntryFormData & { contentTypeId: string },
	) => {
		const id = crypto.randomUUID();
		// Handle media field properly
		const media = entryData.media as FileFieldValue | undefined;

		return store.commit(
			events.entryCreated({
				id,
				spaceId: (entryData.spaceId as string) || "",
				contentTypeId: entryData.contentTypeId,
				data: (entryData.data as string) || "",
				storageProviderKey: media?.cid || "", // Add missing storageProviderKey field
				tags: entryData.tags ? JSON.stringify(entryData.tags) : "",
				publishedAt: entryData.publishedAt
					? new Date(entryData.publishedAt as string)
					: new Date(),
			}),
		);
	};

	const updateEntry = (id: string, entryData: Partial<EntryFormData>) => {
		return store.commit(
			events.entryUpdated({
				id,
				...entryData,
			}),
		);
	};

	const deleteEntry = (id: string) => {
		return store.commit(
			events.entryDeleted({
				id,
				deletedAt: new Date(),
			}),
		);
	};

	const createContentType = (contentTypeData: {
		id: string;
		spaceId: string;
		name: string;
		description: string;
		properties: Record<string, any>;
		required: string[];
	}) => {
		return store.commit(
			events.contentTypeCreated({
				id: contentTypeData.id,
				spaceId: (contentTypeData.spaceId as string) || "",
				name: contentTypeData.name,
				description: contentTypeData.description,
				properties: JSON.stringify(contentTypeData.properties),
				required: JSON.stringify(contentTypeData.required),
			}),
		);
	};

	const updateContentType = (
		id: string,
		contentTypeData: Partial<{
			name: string;
			description: string;
			properties: Record<string, any>;
			required: string[];
		}>,
	) => {
		return store.commit(
			events.contentTypeUpdated({
				id,
				name: contentTypeData.name || "",
				description: contentTypeData.description || "",
				properties: contentTypeData.properties
					? JSON.stringify(contentTypeData.properties)
					: "",
				required: contentTypeData.required
					? JSON.stringify(contentTypeData.required)
					: "",
			}),
		);
	};

	const deleteContentType = (id: string) => {
		return store.commit(
			events.contentTypeDeleted({
				id,
				deletedAt: new Date(),
			}),
		);
	};

	const setUiState = (uiState: {
		currentContentTypeId?: string;
		currentSpaceId?: string;
		formData?: string;
		isSubmitting?: boolean;
		uploadProgress?: number;
	}) => {
		return store.commit(events.uiStateSet(uiState));
	};

	const createStorachaStorageAuthorization = (authData: {
		id: string;
		spaceId: string;
		delegationCid: string;
		delegationData: string;
		clientDid: string;
		isActive: boolean;
		authorizedAt: Date;
		expiresAt?: Date;
	}) => {
		return store.commit(
			events.storachaStorageAuthorized({
				id: authData.id,
				spaceId: authData.spaceId,
				delegationCid: authData.delegationCid,
				delegationData: authData.delegationData,
				clientDid: authData.clientDid,
				isActive: authData.isActive,
				authorizedAt: authData.authorizedAt,
				expiresAt: authData.expiresAt,
			}),
		);
	};

	return {
		store,
		createEntry,
		updateEntry,
		deleteEntry,
		createContentType,
		updateContentType,
		deleteContentType,
		setUiState,
		createStorachaStorageAuthorization,
	};
};
