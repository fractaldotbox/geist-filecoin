import { match } from "ts-pattern";
import type { AuthInput } from "./input";

export const NAME_SERVICE_POLICY_SCHEMA = {
	title: "Name Service",
	type: "object",
	key: "name-service-policy-criteria",
	properties: {
		domain: {
			type: "string",
			description: "only subdomain or domain are allowed",
			examples: ["abc.com"],
		},
        isRootDomainOnly: {
            type: "boolean",
            description: "reject subdomain if true",
            examples: [true],
        }
	},
	required: ["didPattern", "claims"],
};


function isWithinDomain(name: string, domains: string[]): boolean {
    if (domains.length === 1 && domains[0] === name) {
        return true;
    }
    //subdomain
    return domains.some(domain =>
        match(name)
            .when(n => n.endsWith(`.${domain}`) && n !== domain, () => true)
            .otherwise(() => false)
    );
}

export const checkNameServiceCriteria = async (policyConfig: any, input: AuthInput) => {
	const { domain, isRootDomainOnly } = policyConfig;

    const name = input.context.name;

    if (isRootDomainOnly) {
        return domain === name;
    }

    if (isWithinDomain(name, domain)) {
        return true;
    }

	return false;
};

