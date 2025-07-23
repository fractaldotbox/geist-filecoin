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
					"space/blob/add",
					"space/blob/get",
					"space/blob/delete",
					"space/blob/update",
					"space/blob/list",
					"space/blob/get-url",
					"space/blob/get-url-signed",
					"space/blob/get-url-signed-with-expiry",
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
