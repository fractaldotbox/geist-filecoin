import { useStore } from "@livestore/react";
import { events } from "../../../livestore/schema";
import type { EntryFormData, FileFieldValue } from "../fields/types";

export const useLiveStore = () => {
	const { store } = useStore();

	const createEntry = (
		entryData: Partial<EntryFormData> & { contentTypeId: string; id: string },
	) => {
		// Handle media field properly
		const media = entryData.media as FileFieldValue | undefined;

		const storageProviderMetadata = {
			...(entryData.storageProviderMetadata as {
				spaceId?: string;
				cid?: string;
			}),
			media: {
				name: media?.file?.name,
			},
		};

		return store.commit(
			events.entryCreated({
				id: entryData.id,
				name: (entryData.name as string) || "",
				spaceId: (entryData.spaceId as string) || "",
				contentTypeId: entryData.contentTypeId,
				data: (entryData.data as string) || "",
				storageProviderKey: "storacha",
				storageProviderMetadata: JSON.stringify(storageProviderMetadata),
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
				name: entryData.name as string,
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
		// to match account did
		currentUserDid?: string;
		// Login dialog UI state
		isLoginDialogOpen?: boolean;
		currentLoginEmail?: string;
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

	const createAccessPolicy = (accessPolicyData: {
		spaceId: string;
		criteriaType: string;
		criteria: string;
		access: string;
		createdAt: Date;
	}) => {
		return store.commit(
			events.accessPolicyCreated({
				id: crypto.randomUUID(),
				spaceId: accessPolicyData.spaceId,
				criteriaType: accessPolicyData.criteriaType,
				criteria: accessPolicyData.criteria,
				access: accessPolicyData.access,
				createdAt: accessPolicyData.createdAt,
			}),
		);
	};

	const updateAccessPolicy = (
		id: string,
		accessPolicyData: Partial<{
			spaceId: string;
			criteriaType: string;
			criteria: string;
			access: string;
		}>,
	) => {
		return store.commit(
			events.accessPolicyUpdated({
				id,
				...accessPolicyData,
			}),
		);
	};

	const deleteAccessPolicy = (id: string) => {
		return store.commit(
			events.accessPolicyDeleted({
				id,
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
		createAccessPolicy,
		updateAccessPolicy,
		deleteAccessPolicy,
	};
};
