import { createStorage } from "unstorage";
import fsLiteDriver from "unstorage/drivers/fs-lite";

import { join } from "node:path";

// Define a common type for all schemas
export type Schema = Record<string, unknown>;

// Create storage instance with filesystem driver
const storage = createStorage({
  driver: fsLiteDriver({
    base: join(process.cwd(), 'src/schemas')
  })
});

export const loadAllSchemaIds = async () => {
  return (await storage.getKeys())
}

// Load a schema from storage
export async function loadSchema(filename: string): Promise<Schema> {
  try {
    const content = await storage.getItem(`${filename}.json`);
    if (!content) {
      throw new Error(`Schema ${filename}.json not found`);
    }
    return typeof content === 'string' ? JSON.parse(content) : content;
  } catch (error) {
    console.error(`Error loading schema ${filename}:`, error);
    return {};
  }
}

export type SchemaId = string;

export const getSchemaWithId = async (id: string) => {
  const schema = await loadSchema(id);

  return schema;
} 