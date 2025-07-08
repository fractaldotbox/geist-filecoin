import type { AuthInput } from "./input";
import { gql, rawRequest } from "graphql-request";
import { base, mainnet, optimism, sepolia } from "viem/chains";

export const EAS_POLICY_SCHEMA = {
	title: "EAS Policy",
	type: "object",
	key: "eas-policy-criteria",
	properties: {
		schemaUid: {
			type: "string",
			description: "Schema ID",
			examples: ["0x5c4ed4a8d343e78cf71f765ea8afa2b85dbf5673a613ed8398e88f4c85ad767e"],
		},
		schemaId: {
			type: "string",
			description: "Schema ID",
			examples: ["3382"],
		},
		chainId: {
			type: "string",
			description: "Chain ID",
			examples: ["11155111"],
		},
		//  use the indexed field
		field: {
			type: "string",
			description: "field of attestation contains the DID",
			examples: ["recipient"],
		},
	},
	required: ["schemaUid", "field", "chainId"],
};

export const EAS_CONFIG_BY_CHAIN_ID = {
	[mainnet.id]: {
		eas: "0xA1207F3BBa224E2c9c3c6D5aF63D0eb1582Ce587",
		graphqlEndpoint: "https://easscan.org/graphql",
		easscanUrl: "https://easscan.org",
	},
	[sepolia.id]: {
		eas: "0xC2679fBD37d54388Ce493F1DB75320D236e1815e",
		graphqlEndpoint: "https://sepolia.easscan.org/graphql",
		easscanUrl: "https://sepolia.easscan.org",
	},
	[optimism.id]: {
		eas: "0xE132c2E90274B44FfD8090b58399D04ddc060AE1",
		graphqlEndpoint: "https://optimism.easscan.org/graphql",
		easscanUrl: "https://optimism.easscan.org",
	},
	[base.id]: {
		eas: "0xF095fE4b23958b08D38e52d5d5674bBF0C03cbF6",
		graphqlEndpoint: "https://base.easscan.org/graphql",
		easscanUrl: "https://base.easscan.org",
	},
} as Record<
	number,
	{
		eas: string;
		graphqlEndpoint: string;
		easscanUrl: string;
	}
>;


const createRequest = ()=>{
			rawRequest(
				`${getEasscanEndpoint(chainId)}/graphql`,
				allAttestationsByQuery.toString(),
				{
					where: {
						id: uid,
					},
				},
			)
}

const allAttestationsByQuery = gql`
  query AttestationById($where: AttestationWhereUniqueInput!) {
    attestation(where: $where) {
      id
      txid
      recipient
      schema {
        index
        schemaNames {
          name
        }
      }
      time
      isOffchain
      schemaId
      attester
    }
  }
`;


export const checkEasCriteria = async (policyConfig: any, input: AuthInput) => {
	const { schemaUid, field, chainId } = policyConfig;
	const { subject } = input;

	const config = EAS_CONFIG_BY_CHAIN_ID[Number(chainId)];
	if (!config) return false;

	try {
		type AttestationResponse = { attestation?: Record<string, any> };
		const { data } = await rawRequest<AttestationResponse>(
			config.graphqlEndpoint,
			allAttestationsByQuery,
			{ where: { id: schemaUid } }
		);

		const attestation = data?.attestation;
		if (!attestation) return false;

		// The field to check is dynamic, e.g. 'recipient'.
		if (attestation[field] && attestation[field] === subject) {
			return true;
		}
		return false;
	} catch (e) {
		return false;
	}
};
