import {
	createDelegationWithCapabilities,
	createUserDelegation,
} from "@geist-filecoin/storage";
import type { Access, AccessPolicy, AuthInput } from "./schemas/access-policy";
import { checkEasCriteria } from "./schemas/eas-policy-criteria";
import { checkEnvCriteria } from "./schemas/env-policy-criteria";
import { createClaimsGenerationRequest } from "./schemas/token-claims";

export const processorsBycriteriaType = {
	env: checkEnvCriteria,
	eas: checkEasCriteria,
};

// union topkens / claims
// TODO aggregate by spaceId
export const processPolicies = async (
	policies: AccessPolicy[],
	input: AuthInput,
) => {
	console.log(input, "policies", policies[0]?.access);

	for (const policy of policies) {
		const processor =
			processorsBycriteriaType[
				policy.criteriaType as keyof typeof processorsBycriteriaType
			];

		if (processor) {
			const isAccessible = await processor(policy.criteria, input);
			if (isAccessible) {
				return true;
			}
		}
	}

	return false;
};

export const authorizeUcan = async (
	policies: AccessPolicy[],
	input: AuthInput,
	config: {
		serverAgentKeyString: string;
		proofString: string;
	},
) => {
	const isAccessible = await processPolicies(policies, input);

	if (!isAccessible) {
		return null;
	}

	// TODO find the relevant proof with spaceId
	// const spaceId = input.context?.spaceId;

	const { delegation, client, space } = await createUserDelegation({
		userDid: input.subject,
		serverAgentKeyString: config.serverAgentKeyString,
		proofString: config.proofString,
	});

	return delegation;
};

// export const authorize = async (policies: AccessPolicy[], input: AuthInput, config: {
// 	serverAgentKeyString: string;
// 	proofString: string;
// })=>{

// 	const byTokenType = createClaimsGenerationRequest(accessByTokenType, input);

// 	const tokenByTokenType = new Map<string, any>();

// 	const ucanRequest = byTokenType.ucan;

// 	console.log('ucanRequest', byTokenType, ucanRequest)

// 	if(ucanRequest){
// 		const { delegation, client, space } = await createUserDelegation({
// 			userDid: input.subject,
// 			serverAgentKeyString: config.serverAgentKeyString,
// 			proofString: config.proofString,
// 		});

// 		tokenByTokenType.set("ucan", {
// 			delegation,
// 			client,
// 			space,
// 		})

// 	}

// 	return tokenByTokenType;
// }
