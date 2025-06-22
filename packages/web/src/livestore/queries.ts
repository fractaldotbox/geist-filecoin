import { queryDb } from '@livestore/livestore'
import { tables } from './schema.js'

// Query for UI state
export const uiState$ = queryDb(
  (get) => tables.uiState.get(),
  { label: 'uiState' },
)

// Query for all entries
export const allEntries$ = queryDb(
  (get) => tables.entries.where({ deletedAt: null }).orderBy('createdAt', 'desc'),
  { label: 'allEntries' },
)

// Query for entries by schema
export const entriesBySchema$ = (schemaId: string) => queryDb(
  (get) => tables.entries.where({ schemaId, deletedAt: null }).orderBy('createdAt', 'desc'),
  { label: `entriesBySchema-${schemaId}` },
)

// Query for a specific entry
export const entryById$ = (id: string) => queryDb(
  (get) => tables.entries.where({ id, deletedAt: null }).first(),
  { label: `entryById-${id}` },
)

// Query for all schemas
export const allSchemas$ = queryDb(
  (get) => tables.schemas.orderBy('createdAt', 'desc'),
  { label: 'allSchemas' },
)

// Query for a specific schema
export const schemaById$ = (id: string) => queryDb(
  (get) => tables.schemas.where({ id }).first(),
  { label: `schemaById-${id}` },
) 