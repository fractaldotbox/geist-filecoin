import { useStore } from "@livestore/react";
import { useLiveStore } from "../components/react/hooks/useLiveStore.js";
import {
	allContentTypes$,
	contentTypeById$,
	uiState$,
} from "../livestore/queries.js";

export interface ContentTypeField {
	type: string;
	description: string;
	format?: string;
	items?: {
		type: string;
	};
	properties?: {
		url?: {
			type: string;
			description: string;
		};
	};
}

export interface ContentType {
	type: string;
	properties: Record<string, ContentTypeField>;
	required: string[];
}

// Hook to get content type from LiveStore
export function useContentType(contentTypeId: string) {
	const { store } = useStore();

	return store.useQuery(contentTypeById$(contentTypeId));
}

// Hook to get content type with loading state
export function useContentTypeWithLoading(contentTypeId: string) {
	const { store } = useStore();

	const contentType = store.useQuery(contentTypeById$(contentTypeId));
	// Note: LiveStore doesn't expose loading state directly in this version
	// We'll return undefined for isLoading for now
	return { contentType, isLoading: undefined };
}

// Legacy compatibility - export a hook that mimics the old contentTypeStore behavior
export function useContentTypeStore() {
	const { store } = useStore();
	const { setUiState } = useLiveStore();

	// Get current content type ID from UI state
	const uiState = store.useQuery(uiState$);

	const currentContentTypeId = uiState?.currentContentTypeId || "";
	const contentType = useContentType(currentContentTypeId);

	return {
		contentType,
		currentContentTypeId,
		setCurrentContentTypeId: (id: string) =>
			setUiState({ currentContentTypeId: id }),
	};
}
