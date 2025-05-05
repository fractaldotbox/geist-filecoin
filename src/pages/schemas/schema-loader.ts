import { readFileSync } from "node:fs";
import { join } from "node:path";

// Define a common type for all schemas
export type Schema = Record<string, unknown>;

// Load a schema from a file
export function loadSchema(filename: string): Schema {
	try {
		return JSON.parse(
			readFileSync(
				join(process.cwd(), `src/pages/schemas/${filename}.json`),
				"utf-8",
			),
		);
	} catch (error) {
		console.error(`Error loading schema ${filename}:`, error);
		return {};
	}
}

// Schema IDs
export const schemaIds = ["landing", "product", "blog"] as const;
export type SchemaId = (typeof schemaIds)[number];

// Load all schemas
export const schemas: Record<SchemaId, Schema> = {
	landing: loadSchema("landing"),
	product: loadSchema("product"),
	blog: loadSchema("blog"),
};

// Get all schemas with their IDs
export function getAllSchemas() {
	return schemaIds.map((id) => ({ id, schema: schemas[id] }));
}

// Get a schema by ID
export function getSchemaById(id: string) {
	return schemas[id as SchemaId] || null;
}
