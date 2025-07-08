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
): Promise<Record<string, Access>> => {
	console.log(input, "policies", policies[0]?.access);

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
