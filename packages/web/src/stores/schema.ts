import { useStore } from '@livestore/react'
import { allSchemas$, schemaById$, uiState$ } from '../livestore/queries.js'
import { useLiveStore } from '../components/react/hooks/useLiveStore.js'

export interface SchemaField {
	type: string;
	description: string;
	format?: string;
	items?: {
		type: string;
	};
	properties?: {
		mediaType?: {
			type: string;
			description: string;
		};
		url?: {
			type: string;
			description: string;
		};
	};
}

export interface Schema {
	type: string;
	properties: Record<string, SchemaField>;
	required: string[];
}

// Hook to get schema from LiveStore
export function useSchema(schemaId: string) {
	const { store } = useStore()
	const { createSchema } = useLiveStore();
	const existingSchemas = store.useQuery(allSchemas$);

	return store.useQuery(schemaById$(schemaId))
}

// Hook to get schema with loading state
export function useSchemaWithLoading(schemaId: string) {
	const { store } = useStore()

	const schema = store.useQuery(schemaById$(schemaId))
	// Note: LiveStore doesn't expose loading state directly in this version
	// We'll return undefined for isLoading for now
	return { schema, isLoading: undefined }
}

// Legacy compatibility - export a hook that mimics the old schemaStore behavior
export function useSchemaStore() {
	const { store } = useStore()
	const { setUiState } = useLiveStore()
	
	// Get current schema ID from UI state
	const uiState = store.useQuery(uiState$)
	
	const currentSchemaId = uiState?.currentSchemaId || ''
	const schema = useSchema(currentSchemaId)

	
	return {
		schema,
		currentSchemaId,
		setCurrentSchemaId: (id: string) => setUiState({ currentSchemaId: id })
	}
}

