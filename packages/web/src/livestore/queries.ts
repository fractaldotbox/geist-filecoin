import { queryDb } from "@livestore/livestore";
import { useClientDocument } from "@livestore/react";
import { tables } from "./schema.js";

export const useUiState = () => useClientDocument(tables.uiState);

// Query for all entries
export const allEntries$ = queryDb(
	(get) =>
		tables.entries.where({ deletedAt: null }).orderBy("createdAt", "desc"),
	{ label: "allEntries" },
);

// Query for entries by content type
export const entriesByContentType$ = (contentTypeId: string) =>
	queryDb(
		(get) =>
			tables.entries
				.where({ contentTypeId, deletedAt: null })
				.orderBy("createdAt", "desc"),
		{ label: `entriesByContentType-${contentTypeId}` },
	);

// Query for entries by space
export const entriesBySpace$ = (spaceId: string) =>
	queryDb(
		(get) =>
			tables.entries
				.where({ spaceId, deletedAt: null })
				.orderBy("createdAt", "desc"),
		{ label: `entriesBySpace-${spaceId}` },
	);

// Query for a specific entry
export const entryById$ = (id: string) =>
	queryDb((get) => tables.entries.where({ id, deletedAt: null }).first(), {
		label: `entryById-${id}`,
	});

// Query for all content types
export const allContentTypes$ = queryDb(
	(get) =>
		tables.contentTypes.where({ deletedAt: null }).orderBy("createdAt", "desc"),
	{ label: "allContentTypes" },
);

// Query for a specific content type
export const contentTypeById$ = (id: string) =>
	queryDb((get) => tables.contentTypes.where({ id }).first(), {
		label: `contentTypeById-${id}`,
	});

// Query for all active spaces
export const allSpaces$ = queryDb(
	(get) =>
		tables.spaces.where({ deletedAt: null }).orderBy("createdAt", "desc"),
	{ label: "allSpaces" },
);

// Query for the first active space (used as current space for now)
export const firstSpace$ = queryDb(
	(get) =>
		tables.spaces
			.where({ deletedAt: null })
			.orderBy("createdAt", "desc")
			.first({ fallback: () => null }),
	{ label: "firstSpace" },
);

// Query for a specific space
export const spaceById$ = (id: string) =>
	queryDb((get) => tables.spaces.where({ id, deletedAt: null }).first(), {
		label: `spaceById-${id}`,
	});

// Query for all active storage authorizations
export const allActiveStorageAuthorizations$ = queryDb(
	(get) =>
		tables.storageAuthorizations
			.where({ isActive: 1 })
			.orderBy("createdAt", "desc"),
	{ label: "allActiveStorageAuthorizations" },
);

// Query for storage authorizations by space
export const storageAuthorizationsBySpace$ = (spaceId: string) =>
	queryDb(
		(get) =>
			tables.storageAuthorizations
				.where({ spaceId, isActive: 1 })
				.orderBy("createdAt", "desc"),
		{ label: `storageAuthorizationsBySpace-${spaceId}` },
	);

// Query for the latest active storage authorization for a space
export const latestStorageAuthorizationForSpace$ = (spaceId: string) =>
	queryDb(
		(get) =>
			tables.storageAuthorizations
				.where({ spaceId, isActive: 1 })
				.orderBy("createdAt", "desc")
				.first({ fallback: () => null }),
		{ label: `latestStorageAuthorizationForSpace-${spaceId}` },
	);

// Query for all access rules
export const allAccessRules$ = queryDb(
	(get) => tables.accessRules.orderBy("createdAt", "desc"),
	{ label: "allAccessRules" },
);

// Query for access rules by space
export const accessRulesBySpace$ = (spaceId: string) =>
	queryDb(
		(get) => tables.accessRules.where({ spaceId }).orderBy("createdAt", "desc"),
		{ label: `accessRulesBySpace-${spaceId}` },
	);

// Query for a specific access rule
export const accessRuleById$ = (id: string) =>
	queryDb((get) => tables.accessRules.where({ id }).first(), {
		label: `accessRuleById-${id}`,
	});
