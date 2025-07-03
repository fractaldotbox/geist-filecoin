import type { AuthInput } from "./input";

export const ENV_POLICY_SCHEMA = {
	title: "Access Rule",
	type: "object",
	key: "env-policy-criteria",
	properties: {
		whitelistEnvKey: {
			type: "string",
			description: "Environment Variable key for DID whiteList",
			examples: ["GEIST_USER"],
		},
	},
	required: ["didPattern", "claims"],
};

export const checkEnvCriteria = async (policyConfig: any, input: AuthInput) => {
	const { whitelistEnvKey } = policyConfig;

	const whitelist = input.context?.env[whitelistEnvKey];

	console.log("whitelist", whitelist, whitelistEnvKey);
	console.log("checkEnvCriteria, input", input);
	if (!whitelist) {
		return false;
	}

	const dids = whitelist.split(",") || [];

	const { subject, context } = input;

	if (!dids.includes(subject)) {
		return false;
	}

	return true;
};
