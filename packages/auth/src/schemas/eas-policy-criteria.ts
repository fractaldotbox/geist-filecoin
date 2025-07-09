import { gql, rawRequest } from "graphql-request";
import { decodeAbiParameters, parseAbiParameters } from "viem";
import { base, mainnet, optimism, sepolia } from "viem/chains";
import type { AuthInput } from "./input";

export const EAS_POLICY_SCHEMA = {
	title: "EAS Policy",
	type: "object",
	key: "eas-policy-criteria",
	properties: {
		schemaUid: {
			type: "string",
			description: "Schema ID",
			examples: [
				"0xebadd94211a4f129fd1803e6120cc0d68612a89f742f0008cd765302ea101dfb",
			],
		},
		schemaId: {
			type: "string",
			description: "Schema ID",
			examples: ["3383"],
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

// This function was incomplete and unused - removing it

const allAttestationsByQuery = gql`
  query allAttestationsBy($where: AttestationWhereInput!) {
    attestations(where: $where) {
      id
      txid
      recipient
      data
      schema {
        id
        index
        schema
        schemaNames {
          name
        }
      }
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

	console.log("config", config);
	try {
		type AttestationResponse = { attestations?: Record<string, any>[] };
		const { data } = await rawRequest<AttestationResponse>(
			config.graphqlEndpoint,
			allAttestationsByQuery.toString(),
			{
				where: {
					schemaId: {
						in: [
							"0xebadd94211a4f129fd1803e6120cc0d68612a89f742f0008cd765302ea101dfb",
						],
					},
				},
			},
		);

		const attestation = data?.attestations?.[0];
		console.log("onchain results", data);

		// TODO use fixed schema directly
		const schema = attestation?.schema?.schema;

		if (!attestation) return false;

		// For metadata fields (recipient, attester, etc.), check directly
		// if (["recipient", "attester", "schemaId"].includes(field)) {
		// 	if (attestation[field] && attestation[field] === subject) {
		// 		return true;
		// 	}
		// 	return false;
		// }

		// For schema data fields, decode the attestation data using viem
		if (attestation.data && schema) {
			try {
				// Parse the schema definition to get ABI parameters
				const schemaDefinition = attestation.schema.schema;
				const abiParameters = parseAbiParameters(schemaDefinition);

				// Ensure we have an array of ABI parameters
				const parametersArray = Array.isArray(abiParameters)
					? abiParameters
					: [abiParameters];

				// Decode the attestation data
				const decodedData = decodeAbiParameters(
					parametersArray,
					attestation.data,
				);
				console.log("decoded attestation data", decodedData);

				// TODO use abi param to pick index

				const fieldValue = decodedData[0];

				console.log("fieldValue", fieldValue, subject);
				return fieldValue === subject;
			} catch (error) {
				console.error("Failed to decode attestation data:", error);
				return false;
			}
		}

		return false;
	} catch (e) {
		console.error("Error fetching attestation:", e);
		return false;
	}
};
