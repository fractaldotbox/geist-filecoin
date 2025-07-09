import type { CodegenConfig } from "@graphql-codegen/cli";

const config: CodegenConfig = {
	ignoreNoDocuments: true,
	generates: {
		"./src/graphql/eas/": {
			preset: "client",
			documents: ["../eas/**/*.ts"],
			schema: "https://easscan.org/graphql",
			presetConfig: {
				gqlTagName: "gql",
			},
			config: {
				documentMode: "string",
			},
		},
	},
};

export default config;
