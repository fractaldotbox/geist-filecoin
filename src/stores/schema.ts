import { atom } from "nanostores";

interface SchemaField {
	type: string;
	description: string;
	format?: string;
	items?: {
		type: string;
	};
}

interface Schema {
	type: string;
	properties: Record<string, SchemaField>;
	required: string[];
}

export const schemaStore = atom<Schema | null>(null);

export async function loadSchema(template: string) {
	try {
		const response = await fetch(`/schemas/${template}.json`);
		const schema = await response.json();
		schemaStore.set(schema);
	} catch (error) {
		console.error("Failed to load schema:", error);
		schemaStore.set(null);
	}
}
