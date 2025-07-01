import type { AccessPolicy, AuthInput } from "./schemas/access-policy";
import { checkEasRule } from "./schemas/eas-policy-criteria";
import { checkEnvCriteria } from "./schemas/env-policy-criteria";

export const processorsByPolicyType = {
    env: checkEnvCriteria,
    eas: checkEasRule,
}


// union topkens / claims 
export const processRules = async (policies: AccessPolicy[], input: AuthInput)=>{
    
    const claimsByTokenType = new Map<string, Set<string>>();
    for(const policy of policies){
        const processor = processorsByPolicyType[policy.policyType as keyof typeof processorsByPolicyType];
        if(processor){
            const result = await processor(policy.policyConfig, input);
            if(result){
                const existing = claimsByTokenType.get(policy.tokenType);
                if(existing){
                    for (const claim of policy.claims){
                        existing.add(claim)
                    }
                    claimsByTokenType.set(policy.tokenType, existing);
                } else {
                    claimsByTokenType.set(policy.tokenType, new Set(policy.claims));
                }
            }
        }
    }

    return claimsByTokenType;
}


// export const authorize = async (policies: AccessPolicy[], input: AuthInput)=>{
//     const result = await processRules(policies, input);
    
 
//     return result;
// }