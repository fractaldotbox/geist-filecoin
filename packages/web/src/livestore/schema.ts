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
			contentTypeId: State.SQLite.text({ default: "" }),
			title: State.SQLite.text({ default: "" }),
			content: State.SQLite.text({ default: "" }),
			mediaType: State.SQLite.text({ nullable: true }),
			mediaUrl: State.SQLite.text({ nullable: true }),
			mediaCid: State.SQLite.text({ nullable: true }),
			tags: State.SQLite.text({ nullable: true }), // JSON string
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

	// Client documents can be used for local-only state (e.g. form inputs)
	uiState: State.SQLite.clientDocument({
		name: "uiState",
		schema: Schema.Struct({
			currentContentTypeId: Schema.String,
			formData: Schema.String, // JSON string
			isSubmitting: Schema.Boolean,
			uploadProgress: Schema.Number,
		}),
		default: {
			id: SessionIdSymbol,
			value: {
				currentContentTypeId: "",
				formData: "{}",
				isSubmitting: false,
				uploadProgress: 0,
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
			contentTypeId: Schema.String,
			title: Schema.String,
			content: Schema.String,
			mediaType: Schema.String,
			mediaUrl: Schema.String,
			mediaCid: Schema.String,
			tags: Schema.String,
			publishedAt: Schema.Date,
		}),
	}),

	entryUpdated: Events.synced({
		name: "v1.EntryUpdated",
		schema: Schema.Struct({
			id: Schema.String,
			title: Schema.String,
			content: Schema.String,
			mediaType: Schema.String,
			mediaUrl: Schema.String,
			mediaCid: Schema.String,
			tags: Schema.String,
			publishedAt: Schema.Date,
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
			name: Schema.String,
			description: Schema.String,
			properties: Schema.String, // JSON string
			required: Schema.String, // JSON string
		}),
	}),

	contentTypeDeleted: Events.synced({
		name: "v1.ContentTypeDeleted",
		schema: Schema.Struct({ id: Schema.String, deletedAt: Schema.Date }),
	}),

	uiStateSet: tables.uiState.set,
};

// Materializers are used to map events to state (https://docs.livestore.dev/reference/state/materializers)
const materializers = State.SQLite.materializers(events, {
	"v1.EntryCreated": ({
		id,
		contentTypeId,
		title,
		content,
		mediaType,
		mediaUrl,
		mediaCid,
		tags,
		publishedAt,
	}) =>
		tables.entries.insert({
			id,
			contentTypeId,
			title,
			content,
			mediaType,
			mediaUrl,
			mediaCid,
			tags,
			publishedAt,
			createdAt: new Date(),
			updatedAt: new Date(),
		}),

	"v1.EntryUpdated": ({
		id,
		title,
		content,
		mediaType,
		mediaUrl,
		mediaCid,
		tags,
		publishedAt,
	}) =>
		tables.entries
			.update({
				title,
				content,
				mediaType,
				mediaUrl,
				mediaCid,
				tags,
				publishedAt,
				updatedAt: new Date(),
			})
			.where({ id }),

	"v1.EntryDeleted": ({ id, deletedAt }) =>
		tables.entries.update({ deletedAt }).where({ id }),

	"v1.ContentTypeCreated": ({ id, name, description, properties, required }) =>
		tables.contentTypes.insert({
			id,
			name,
			description,
			properties,
			required,
			createdAt: new Date(),
			updatedAt: new Date(),
		}),

	"v1.ContentTypeUpdated": ({ id, name, description, properties, required }) =>
		tables.contentTypes
			.update({
				name,
				description,
				properties,
				required,
				updatedAt: new Date(),
			})
			.where({ id }),

	"v1.ContentTypeDeleted": ({ id, deletedAt }) =>
		tables.contentTypes.update({ deletedAt }).where({ id }),
});

const state = State.SQLite.makeState({ tables, materializers });

export const schema = makeSchema({ events, state });
