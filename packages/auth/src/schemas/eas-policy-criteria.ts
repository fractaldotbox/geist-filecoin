import type { AuthInput } from "./input";

export const EAS_POLICY_SCHEMA = {
	title: "EAS Policy",
	type: "object",
	key: "eas-policy-criteria",
	properties: {
		schemaId: {
			type: "string",
			description: "Schema ID",
			examples: ["12"],
		},
		//  use the indexed field
		field: {
			type: "string",
			description: "field of attestation contains the DID",
			examples: ["recipient"],
		},
	},
	required: ["didPattern", "claims"],
};

export const checkEasCriteria = async (policyConfig: any, input: AuthInput) => {
	const { schemaId, field } = policyConfig;

	const { subject, context } = input;

	// query indexed data
	// TODO
	// const schema = await getSchema(schemaId);
	const isValid = true;
	// const isValid = validate(rule, EAS_POLICY_SCHEMA);
	return isValid;
};
