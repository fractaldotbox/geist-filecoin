import type { Access, AccessPolicy, AuthInput } from "./access-policy";

export const CLAIMS_SCHEMA = {
	title: "Claims Policy",
	type: "object",
	properties: {
		required: ["tokenType", "claims"],
		anyOf: [
			{
				tokenType: "ucan",
				claims: [
					"space/info",
					"upload/list",
					"upload/create",
					"upload/update",
					"upload/read",
				],
				spaceId: {
					type: "string",
					description: "The space ID to generate the claims for",
				},
			},
			{
				tokenType: "jwt",
				claims: ["admin:iam"],
			},
		],
	},
};
