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

export type ContentType = {
	id: string;
	spaceId: string;
	name: string;
	description: string;
	properties: Record<string, ContentTypeField>;
	required: string[];
	createdAt: Date;
};
