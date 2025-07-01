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
