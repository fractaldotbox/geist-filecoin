import type { AuthInput } from "./input";

export const ENV_RULE_SCHEMA = {
	title: "Access Rule",
	type: "object",
	key: "env-rule-criteria",
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

	const whitelist = input.env[whitelistEnvKey];

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
