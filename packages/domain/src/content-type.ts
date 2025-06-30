export type ContentType = {
	id: string;
	spaceId: string;
	name: string;
	description: string;
	properties: Record<string, any>;
	required: string[];
	createdAt: Date;
};
