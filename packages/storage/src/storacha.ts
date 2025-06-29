import {
	Signer,
	type DID as W3DID,
} from "@web3-storage/w3up-client/principal/ed25519";
import * as Proof from "@web3-storage/w3up-client/proof";
import type {
	Client,
	EmailAddress,
	FileLike,
	ProgressStatus,
} from "@web3-storage/w3up-client/types";

// from ky https://github.com/sindresorhus/ky/blob/1d92c203f7f60df37c03d60360237d8cb9bcb30a/source/types/options.ts#L15C1-L23C3
export type DownloadProgress = {
	percent: number;
	transferredBytes: number;

	/**
	Note: If it's not possible to retrieve the body size, it will be `0`.
	*/
	totalBytes: number;
};

import * as DID from "@ipld/dag-ucan/did";
import type { ServiceAbility } from "@web3-storage/w3up-client/types";

// import * as DID from "@ipld/dag-ucan/did";
import { create } from "@web3-storage/w3up-client";
import { StoreMemory } from "@web3-storage/w3up-client/stores/memory";

// enable sync methods
import * as ed from "@noble/ed25519";
import { sha512 } from "@noble/hashes/sha512";

export type StorachaInitParams = {
	keyString: string;
	proofString: string;
	store?: StoreMemory;
};

export type FileParams<T> = {
	files: T[];
	uploadProgressCallback?: (data: DownloadProgress) => void;
};

//@ts-ignore
ed.etc.sha512Sync = (...m) => sha512(ed.etc.concatBytes(...m));

export interface StorachaConfig {
	client: Client;
	spaceDid: W3DID;
}

export const getEnv = (key: string) => {
	return import.meta.env?.[key] || process?.env?.[key];
};

// TODO support other bundlers
export const loadStorachaConfig = () => {
	const keyString = getEnv("VITE_STORACHA_KEY");
	const proofString = getEnv("VITE_STORACHA_PROOF");
	if (!keyString || !proofString) {
		throw new Error("Missing VITE_STORACHA_KEY or VITE_STORACHA_PROOF");
	}
	return { keyString, proofString };
};

// @w3ui use indexed DB with unextractable `CryptoKey`s.
// https://github.com/storacha/w3ui/blob/main/packages/core/src/index.ts#L69

export const createClient = async (options: any) => {
	const store = new StoreMemory();

	const client = await create({
		...options,
		store,
	});
	return client;
};

export const authWithEmail = async (client: Client, email: EmailAddress) => {
	const account = await client.login(email);

	return account;
};

export const listFiles = async ({
	client,
	spaceDid,
}: StorachaConfig): Promise<any> => {
	await client.setCurrentSpace(spaceDid);
	return await client.capability.upload.list({ cursor: "", size: 25 });
};

export const uploadFiles = async (
	config: StorachaConfig,
	{ files, uploadProgressCallback }: FileParams<FileLike>,
) => {
	const { client } = config;
	let link: any;
	const onUploadProgress = (progress: ProgressStatus) => {
		uploadProgressCallback?.({
			transferredBytes: progress.loaded,
			totalBytes: progress.total,
			percent: progress.loaded / progress.total,
		});
	};
	if (files.length === 1) {
		const [file] = files;
		if (!file) throw new Error("No file provided");
		link = await client.uploadFile(file, {
			onUploadProgress,
		});
	} else {
		// seems wont return actual progress
		link = await client.uploadDirectory(files, {
			onUploadProgress,
		});
	}

	if (uploadProgressCallback) {
		uploadProgressCallback({
			transferredBytes: link.byteLength,
			totalBytes: link.byteLength,
			percent: 1,
		});
	}
	return link;
};

export const createDelegationWithCapabilities = async (
	config: StorachaConfig,
	{
		userDid,
		capabilities = ["space/info", "upload/list", "upload/add"],
	}: {
		userDid: string;
		capabilities: ServiceAbility[];
	},
) => {
	const { client } = config;
	const audience = DID.parse(userDid);
	console.log("create delegation", client.did(), audience.did());
	await client.setCurrentSpace(config.spaceDid);

	const expiration = Math.floor(Date.now() / 1000) + 60 * 60 * 24; // 24 hours from now
	const delegation = await client.createDelegation(audience, capabilities, {
		expiration,
	});
	console.log("create delegation success");

	const archive = await delegation.archive();
	return archive.ok;
};

export const initStorachaClient = async ({
	keyString,
	proofString,
	store = new StoreMemory(),
}: StorachaInitParams) => {
	const principal = Signer.parse(keyString);
	const client = await createClient({
		principal,
	});

	const proof = await Proof.parse(proofString);
	const space = await client.addSpace(proof);

	await client.setCurrentSpace(space.did());
	await client.addProof(proof);
	console.log(
		`storcha init: principal ${principal.did()} space ${space.did()}`,
	);

	return {
		client,
		space,
	};
};

export type DelegationFlowParams = {
	userDid: string;
	serverAgentKeyString: string;
	proofString?: string;
};

export type DelegationFlowResult = {
	delegation: any;
	client: Client;
	space: any;
};

/**
 * Creates a delegation for a user DID using a server agent
 * This function encapsulates the complete delegation flow including:
 * - Initializing the server client
 * - Creating the delegation for the user
 */
export const createUserDelegation = async ({
	userDid,
	serverAgentKeyString,
	proofString = "",
}: DelegationFlowParams): Promise<DelegationFlowResult> => {
	// Initialize the server client
	const { client, space } = await initStorachaClient({
		keyString: serverAgentKeyString,
		proofString,
	});

	console.log("init client", client.did(), client.currentSpace()?.did());
	const delegation = await createDelegationWithCapabilities(
		{
			client,
			spaceDid: space.did(),
		},
		{
			userDid,
			capabilities: ["space/info", "upload/list", "upload/add"],
		},
	);

	console.log(
		"delegation created successfully",
		"by",
		client.did(),
		"for",
		userDid,
		"with",
		space.did(),
	);
	return {
		delegation,
		client,
		space,
	};
};
