import {
	Events,
	Schema,
	SessionIdSymbol,
	State,
	makeSchema,
} from "@livestore/livestore";

// You can model your state as SQLite tables (https://docs.livestore.dev/reference/state/sqlite-schema)
export const tables = {
	entries: State.SQLite.table({
		name: "entries",
		columns: {
			id: State.SQLite.text({ primaryKey: true }),
			spaceId: State.SQLite.text({ default: "" }), // Associate with space
			contentTypeId: State.SQLite.text({ default: "" }),
			name: State.SQLite.text({ default: "" }),
			data: State.SQLite.text({ default: "" }),
			storageProviderKey: State.SQLite.text({ default: "" }), // Storacha upload CID
			tags: State.SQLite.text({ default: "[]" }), // JSON string
			publishedAt: State.SQLite.integer({
				nullable: true,
				schema: Schema.DateFromNumber,
			}),
			createdAt: State.SQLite.integer({ schema: Schema.DateFromNumber }),
			updatedAt: State.SQLite.integer({ schema: Schema.DateFromNumber }),
			deletedAt: State.SQLite.integer({
				nullable: true,
				schema: Schema.DateFromNumber,
			}),
		},
	}),

	contentTypes: State.SQLite.table({
		name: "contentTypes",
		columns: {
			id: State.SQLite.text({ primaryKey: true }),
			spaceId: State.SQLite.text({ default: "" }), // Associate with space
			name: State.SQLite.text({ default: "" }),
			description: State.SQLite.text({ default: "" }),
			properties: State.SQLite.text({ default: "{}" }), // JSON string
			required: State.SQLite.text({ default: "[]" }), // JSON string
			createdAt: State.SQLite.integer({ schema: Schema.DateFromNumber }),
			updatedAt: State.SQLite.integer({ schema: Schema.DateFromNumber }),
			deletedAt: State.SQLite.integer({
				nullable: true,
				schema: Schema.DateFromNumber,
			}),
		},
	}),

	spaces: State.SQLite.table({
		name: "spaces",
		columns: {
			id: State.SQLite.text({ primaryKey: true }),
			name: State.SQLite.text({ default: "" }),
			description: State.SQLite.text({ default: "" }),
			storageProvider: State.SQLite.text({ default: "storacha" }), // "s3" or "storacha"
			storageProviderCredentials: State.SQLite.text({ default: "" }), // Storage provider credentials
			storageProviderId: State.SQLite.text({ default: "" }), // Storage provider ID
			spaceProof: State.SQLite.text({ default: "" }), // Space proof for verification
			createdAt: State.SQLite.integer({ schema: Schema.DateFromNumber }),
			updatedAt: State.SQLite.integer({ schema: Schema.DateFromNumber }),
			deletedAt: State.SQLite.integer({
				nullable: true,
				schema: Schema.DateFromNumber,
			}),
		},
	}),

	AccessPolicys: State.SQLite.table({
		name: "AccessPolicys",
		columns: {
			id: State.SQLite.text({ primaryKey: true }),
			spaceId: State.SQLite.text(),
			criteriaType: State.SQLite.text(),
			criteria: State.SQLite.text(),
			access: State.SQLite.text(),
			createdAt: State.SQLite.integer({ schema: Schema.DateFromNumber }),
		},
	}),

	storageAuthorizations: State.SQLite.table({
		name: "storageAuthorizations",
		columns: {
			id: State.SQLite.text({ primaryKey: true }),
			spaceId: State.SQLite.text(),
			delegationCid: State.SQLite.text(),
			clientDid: State.SQLite.text(),
			isActive: State.SQLite.integer({ default: 1 }), // 1 for true, 0 for false
			authorizedAt: State.SQLite.integer({ schema: Schema.DateFromNumber }),
			expiresAt: State.SQLite.integer({
				nullable: true,
				schema: Schema.DateFromNumber,
			}),
			createdAt: State.SQLite.integer({ schema: Schema.DateFromNumber }),
			updatedAt: State.SQLite.integer({ schema: Schema.DateFromNumber }),
		},
	}),

	// Client documents can be used for local-only state (e.g. form inputs)
	uiState: State.SQLite.clientDocument({
		name: "uiState",
		schema: Schema.Struct({
			currentContentTypeId: Schema.String,
			currentSpaceId: Schema.String,
			formData: Schema.String, // JSON string
			isSubmitting: Schema.Boolean,
			uploadProgress: Schema.Number,
			// Login dialog UI state
			isLoginDialogOpen: Schema.Boolean,
			currentUserDid: Schema.String,
			currentLoginEmail: Schema.String,
			// Login status
			loginState: Schema.String,
			loginError: Schema.optional(Schema.String),
			// Social login UI state
			isShowSocialLogins: Schema.Boolean,
		}),
		default: {
			id: SessionIdSymbol,
			value: {
				currentContentTypeId: "",
				currentSpaceId: "",
				formData: "{}",
				isSubmitting: false,
				uploadProgress: 0,
				isLoginDialogOpen: false,
				currentUserDid: "",
				currentLoginEmail: "",
				loginState: "idle",
				loginError: undefined,
				isShowSocialLogins: false,
			},
		},
	}),
};

// Events describe data changes (https://docs.livestore.dev/reference/events)
export const events = {
	entryCreated: Events.synced({
		name: "v1.EntryCreated",
		schema: Schema.Struct({
			id: Schema.String,
			name: Schema.String,
			spaceId: Schema.String,
			contentTypeId: Schema.String,
			data: Schema.String,
			storageProviderKey: Schema.String,
			tags: Schema.String,
			publishedAt: Schema.optional(Schema.Date),
		}),
	}),

	entryUpdated: Events.synced({
		name: "v1.EntryUpdated",
		schema: Schema.Struct({
			id: Schema.String,
			name: Schema.String,
			spaceId: Schema.optional(Schema.String),
			data: Schema.optional(Schema.String),
			storageProviderKey: Schema.optional(Schema.String),
			tags: Schema.optional(Schema.String),
			publishedAt: Schema.optional(Schema.Date),
		}),
	}),

	entryDeleted: Events.synced({
		name: "v1.EntryDeleted",
		schema: Schema.Struct({ id: Schema.String, deletedAt: Schema.Date }),
	}),

	contentTypeCreated: Events.synced({
		name: "v1.ContentTypeCreated",
		schema: Schema.Struct({
			id: Schema.String,
			spaceId: Schema.String,
			name: Schema.String,
			description: Schema.String,
			properties: Schema.String, // JSON string
			required: Schema.String, // JSON string
		}),
	}),

	contentTypeUpdated: Events.synced({
		name: "v1.ContentTypeUpdated",
		schema: Schema.Struct({
			id: Schema.String,
			spaceId: Schema.optional(Schema.String),
			name: Schema.optional(Schema.String),
			description: Schema.optional(Schema.String),
			properties: Schema.optional(Schema.String), // JSON string
			required: Schema.optional(Schema.String), // JSON string
		}),
	}),

	contentTypeDeleted: Events.synced({
		name: "v1.ContentTypeDeleted",
		schema: Schema.Struct({ id: Schema.String, deletedAt: Schema.Date }),
	}),

	spaceCreated: Events.synced({
		name: "v1.SpaceCreated",
		schema: Schema.Struct({
			id: Schema.String,
			name: Schema.String,
			description: Schema.String,
			storageProvider: Schema.String,
			storageProviderCredentials: Schema.String,
			storageProviderId: Schema.String,
		}),
	}),

	spaceUpdated: Events.synced({
		name: "v1.SpaceUpdated",
		schema: Schema.Struct({
			id: Schema.String,
			name: Schema.String,
			description: Schema.String,
			storageProvider: Schema.String,
			storageProviderCredentials: Schema.String,
			storageProviderId: Schema.String,
		}),
	}),

	spaceDeleted: Events.synced({
		name: "v1.SpaceDeleted",
		schema: Schema.Struct({ id: Schema.String, deletedAt: Schema.Date }),
	}),

	storachaStorageAuthorized: Events.synced({
		name: "v1.StorachaStorageAuthorized",
		schema: Schema.Struct({
			id: Schema.String,
			spaceId: Schema.String,
			delegationCid: Schema.String,
			delegationData: Schema.String,
			clientDid: Schema.String,
			isActive: Schema.Boolean,
			authorizedAt: Schema.Date,
			expiresAt: Schema.optional(Schema.Date),
		}),
	}),

	accessPolicyCreated: Events.synced({
		name: "v1.AccessPolicyCreated",
		schema: Schema.Struct({
			id: Schema.String,
			spaceId: Schema.String,
			criteriaType: Schema.String,
			criteria: Schema.String,
			access: Schema.String,
			createdAt: Schema.Date,
		}),
	}),

	accessPolicyUpdated: Events.synced({
		name: "v1.AccessPolicyUpdated",
		schema: Schema.Struct({
			id: Schema.String,
			spaceId: Schema.optional(Schema.String),
			criteriaType: Schema.optional(Schema.String),
			criteria: Schema.optional(Schema.String),
			access: Schema.optional(Schema.String),
		}),
	}),

	accessPolicyDeleted: Events.synced({
		name: "v1.AccessPolicyDeleted",
		schema: Schema.Struct({ id: Schema.String }),
	}),

	uiStateSet: tables.uiState.set,
};

// Materializers are used to map events to state (https://docs.livestore.dev/reference/state/materializers)
const materializers = State.SQLite.materializers(events, {
	"v1.EntryCreated": ({
		id,
		spaceId,
		contentTypeId,
		name,
		data,
		storageProviderKey,
		tags,
		publishedAt,
	}) =>
		tables.entries.insert({
			id,
			spaceId,
			contentTypeId,
			name,
			data,
			storageProviderKey,
			tags,
			publishedAt,
			createdAt: new Date(),
			updatedAt: new Date(),
		}),

	"v1.EntryUpdated": ({ id, ...data }) => {
		// Filter out undefined values and add updatedAt
		const updateData = Object.fromEntries(
			Object.entries({ ...data, updatedAt: new Date() }).filter(
				([_, value]) => value !== undefined,
			),
		);

		return tables.entries.update(updateData).where({ id });
	},

	"v1.EntryDeleted": ({ id, deletedAt }) =>
		tables.entries.update({ deletedAt }).where({ id }),

	"v1.ContentTypeCreated": ({
		id,
		spaceId,
		name,
		description,
		properties,
		required,
	}) =>
		tables.contentTypes.insert({
			id,
			spaceId,
			name,
			description,
			properties,
			required,
			createdAt: new Date(),
			updatedAt: new Date(),
		}),

	"v1.ContentTypeUpdated": ({ id, ...data }) => {
		// Filter out undefined values and add updatedAt
		const updateData = Object.fromEntries(
			Object.entries({ ...data, updatedAt: new Date() }).filter(
				([_, value]) => value !== undefined,
			),
		);

		return tables.contentTypes.update(updateData).where({ id });
	},

	"v1.ContentTypeDeleted": ({ id, deletedAt }) =>
		tables.contentTypes.update({ deletedAt }).where({ id }),

	"v1.SpaceCreated": ({
		id,
		name,
		description,
		storageProvider,
		storageProviderCredentials,
		storageProviderId,
	}) =>
		tables.spaces.insert({
			id,
			name,
			description,
			storageProvider,
			storageProviderCredentials,
			storageProviderId,
			createdAt: new Date(),
			updatedAt: new Date(),
		}),

	"v1.SpaceUpdated": ({
		id,
		name,
		description,
		storageProvider,
		storageProviderCredentials,
		storageProviderId,
	}) =>
		tables.spaces
			.update({
				name,
				description,
				storageProvider,
				storageProviderCredentials,
				storageProviderId,
				updatedAt: new Date(),
			})
			.where({ id }),

	"v1.SpaceDeleted": ({ id, deletedAt }) =>
		tables.spaces.update({ deletedAt }).where({ id }),

	"v1.StorachaStorageAuthorized": ({
		id,
		spaceId,
		delegationCid,
		clientDid,
		isActive,
		authorizedAt,
		expiresAt,
	}) =>
		tables.storageAuthorizations.insert({
			id,
			spaceId,
			delegationCid,
			clientDid,
			isActive: isActive ? 1 : 0,
			authorizedAt,
			expiresAt,
			createdAt: new Date(),
			updatedAt: new Date(),
		}),

	"v1.AccessPolicyCreated": ({
		id,
		spaceId,
		criteriaType,
		criteria,
		access,
		createdAt,
	}) =>
		tables.AccessPolicys.insert({
			id,
			spaceId,
			criteriaType,
			criteria,
			access,
			createdAt,
		}),

	"v1.AccessPolicyUpdated": ({ id, ...data }) => {
		const updateData = Object.fromEntries(
			Object.entries({ ...data }).filter(([_, value]) => value !== undefined),
		);
		return tables.AccessPolicys.update(updateData).where({ id });
	},

	"v1.AccessPolicyDeleted": ({ id }) =>
		tables.AccessPolicys.delete().where({ id }),
});

const state = State.SQLite.makeState({ tables, materializers });

export const schema = makeSchema({ events, state });
