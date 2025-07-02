import type { Access, AccessPolicy, AuthInput } from "./schemas/access-policy";
import { checkEasRule } from "./schemas/eas-policy-criteria";
import { checkEnvCriteria } from "./schemas/env-policy-criteria";
import {  createClaimsGenerationRequest } from "./schemas/token-claims";
import { createDelegationWithCapabilities, createUserDelegation } from "@geist-filecoin/storage";

export const processorsByPolicyType = {
	env: checkEnvCriteria,
	eas: checkEasRule,
};

// union topkens / claims
// TODO aggregate by spaceId
export const processPolicies = async (
	policies: AccessPolicy[],
	input: AuthInput,
) => {
	const accessByTokenType: Record<string, Access> = {};

	for (const policy of policies) {
		const processor =
			processorsByPolicyType[
				policy.policyType as keyof typeof processorsByPolicyType
			];
		if (processor) {
			const isAccessible = await processor(policy.policyCriteria, input);
			if (isAccessible) {
				// TODO handle union
				accessByTokenType[policy.tokenType]= policy.policyAccess;
			}
		}
	}

	return accessByTokenType;
};



export const authorize = async (policies: AccessPolicy[], input: AuthInput, config: {
	serverAgentKeyString: string;
	proofString: string;
})=>{
    const accessByTokenType = await processPolicies(policies, input);

	const byTokenType = createClaimsGenerationRequest(accessByTokenType, input);

	
	const { delegation, client, space } = await createUserDelegation({
		userDid: input.subject,
		// TODO
		serverAgentKeyString: config.serverAgentKeyString,
		proofString: config.proofString,
	})

    return [];
}
