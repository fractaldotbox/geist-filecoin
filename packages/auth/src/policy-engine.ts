import { createUserDelegation } from "@geist-filecoin/storage";
import type { ServiceAbility } from "@storacha/client/types";
import type { Access, AccessPolicy, AuthInput } from "./schemas/access-policy";
import { checkEasCriteria } from "./schemas/eas-policy-criteria";
import { checkEnvCriteria } from "./schemas/env-policy-criteria";

export const processorsBycriteriaType = {
	env: checkEnvCriteria,
	eas: checkEasCriteria,
};

export const processPolicies = async (
	policies: AccessPolicy[],
	input: AuthInput,
): Promise<Record<string, Access>> => {
	console.log(input, "policies", policies);

	const accessByTokenType: Record<string, Access> = {};

	for (const policy of policies) {
		const processor =
			processorsBycriteriaType[
				policy.criteriaType as keyof typeof processorsBycriteriaType
			];

		if (processor) {
			const isAccessible = await processor(policy.criteria, input);
			if (isAccessible) {
				// Group access by token type - last matching policy wins
				const tokenType = policy.tokenType;
				accessByTokenType[tokenType] = {
					claims: [...policy.access.claims],
					metadata: { ...policy.access.metadata },
				};
			}
		}
	}

	return accessByTokenType;
};

export const STORACHA_CAPABILITIES_DEFAULT = [
	"space/info",
	"space/blob/add",
	"space/blob/get",
	"space/blob/delete",
	"space/blob/update",
	"space/blob/list",
	"space/blob/get-url",
	"space/blob/get-url-signed",
	"space/blob/get-url-signed-with-expiry",
	"space/index/add",
	"upload/list",
	"upload/add",
];

export const authorizeUcan = async (
	policies: AccessPolicy[],
	input: AuthInput,
	config: {
		serverAgentKeyString: string;
		proofString: string;
	},
) => {
	const accessByTokenType = await processPolicies(policies, input);

	// Check if any access was granted
	if (Object.keys(accessByTokenType).length === 0) {
		return null;
	}

	const capabilities =
		(accessByTokenType.ucan?.claims as ServiceAbility[]) ||
		STORACHA_CAPABILITIES_DEFAULT;

	// TODO find the relevant proof with spaceId
	// const spaceId = input.context?.spaceId;

	const { delegation, client, space } = await createUserDelegation({
		userDid: input.subject,
		serverAgentKeyString: config.serverAgentKeyString,
		proofString: config.proofString,
		capabilities,
	});

	return delegation;
};
