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

// Query for entries by content type
export const entriesByContentType$ = (contentTypeId: string) => queryDb(
  (get) => tables.entries.where({ contentTypeId, deletedAt: null }).orderBy('createdAt', 'desc'),
  { label: `entriesByContentType-${contentTypeId}` },
)

// Query for a specific entry
export const entryById$ = (id: string) => queryDb(
  (get) => tables.entries.where({ id, deletedAt: null }).first(),
  { label: `entryById-${id}` },
)

// Query for all content types
export const allContentTypes$ = queryDb(
  (get) => tables.contentTypes.orderBy('createdAt', 'desc'),
  { label: 'allContentTypes' },
)

// Query for a specific content type
export const contentTypeById$ = (id: string) => queryDb(
  (get) => tables.contentTypes.where({ id }).first(),
  { label: `contentTypeById-${id}` },
) 