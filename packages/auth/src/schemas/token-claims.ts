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

export const createClaimsGenerationRequest = (
	accessByTokenType: Record<string, Access>,
	input: AuthInput,
) => {
	return Object.fromEntries(
		Object.keys(accessByTokenType).map((tokenType) => {
			const access = accessByTokenType[tokenType] || {
				claims: [],
				metadata: {},
			};

			const { claims, metadata } = access;

			console.log("tokenType", tokenType);
			if (tokenType === "ucan") {
				return [
					tokenType,
					{
						spaceId: metadata.spaceId,
						claims,
					},
				];
			}

			return [
				tokenType,
				{
					claims,
				},
			];
		}),
	);
};
