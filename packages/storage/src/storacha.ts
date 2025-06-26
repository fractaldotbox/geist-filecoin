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

export const listFiles = async ({ client, spaceDid }: StorachaConfig) => {
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

const proofString =
	"mAYIEANw+EaJlcm9vdHOAZ3ZlcnNpb24B1AYBcRIgfDilvX5G6tj6KGuGVvH+A49PegVi9zu5HGd5xpajv4KoYXNYRO2hA0BQ7tnssZSfqGRYWTqcFiwyMYnTo9vT1FAh5fOMM6tqhWqN890jVKLb/EQHLFPUh2PMfJSm5lry3IZJe/a/8ogFYXZlMC45LjFjYXR0iKJjY2FuZ3NwYWNlLypkd2l0aHg4ZGlkOmtleTp6Nk1rdVBmWnBVejFyNEVqQ3E2Z3A5YkdzUmpnd0gxYktiVkdxRXdYVExCNURVSEOiY2NhbmZibG9iLypkd2l0aHg4ZGlkOmtleTp6Nk1rdVBmWnBVejFyNEVqQ3E2Z3A5YkdzUmpnd0gxYktiVkdxRXdYVExCNURVSEOiY2NhbmdpbmRleC8qZHdpdGh4OGRpZDprZXk6ejZNa3VQZlpwVXoxcjRFakNxNmdwOWJHc1JqZ3dIMWJLYlZHcUV3WFRMQjVEVUhDomNjYW5nc3RvcmUvKmR3aXRoeDhkaWQ6a2V5Ono2TWt1UGZacFV6MXI0RWpDcTZncDliR3NSamd3SDFiS2JWR3FFd1hUTEI1RFVIQ6JjY2FuaHVwbG9hZC8qZHdpdGh4OGRpZDprZXk6ejZNa3VQZlpwVXoxcjRFakNxNmdwOWJHc1JqZ3dIMWJLYlZHcUV3WFRMQjVEVUhDomNjYW5oYWNjZXNzLypkd2l0aHg4ZGlkOmtleTp6Nk1rdVBmWnBVejFyNEVqQ3E2Z3A5YkdzUmpnd0gxYktiVkdxRXdYVExCNURVSEOiY2NhbmpmaWxlY29pbi8qZHdpdGh4OGRpZDprZXk6ejZNa3VQZlpwVXoxcjRFakNxNmdwOWJHc1JqZ3dIMWJLYlZHcUV3WFRMQjVEVUhDomNjYW5ndXNhZ2UvKmR3aXRoeDhkaWQ6a2V5Ono2TWt1UGZacFV6MXI0RWpDcTZncDliR3NSamd3SDFiS2JWR3FFd1hUTEI1RFVIQ2NhdWRYIu0B6x4iEImlyIYBlZiTVreGw/+VaTXNIEHOI6f9Zaf+d+hjZXhwGmo+Ae9jZmN0gaFlc3BhY2WhZG5hbWVlZGVtbzRjaXNzWCLtAd3zk33DAlsAmlcGs92rlxefi/IjtE1F7Sww6Dv9zHKXY3ByZoDUBgFxEiB8OKW9fkbq2Pooa4ZW8f4Dj096BWL3O7kcZ3nGlqO/gqhhc1hE7aEDQFDu2eyxlJ+oZFhZOpwWLDIxidOj29PUUCHl84wzq2qFao3z3SNUotv8RAcsU9SHY8x8lKbmWvLchkl79r/yiAVhdmUwLjkuMWNhdHSIomNjYW5nc3BhY2UvKmR3aXRoeDhkaWQ6a2V5Ono2TWt1UGZacFV6MXI0RWpDcTZncDliR3NSamd3SDFiS2JWR3FFd1hUTEI1RFVIQ6JjY2FuZmJsb2IvKmR3aXRoeDhkaWQ6a2V5Ono2TWt1UGZacFV6MXI0RWpDcTZncDliR3NSamd3SDFiS2JWR3FFd1hUTEI1RFVIQ6JjY2FuZ2luZGV4Lypkd2l0aHg4ZGlkOmtleTp6Nk1rdVBmWnBVejFyNEVqQ3E2Z3A5YkdzUmpnd0gxYktiVkdxRXdYVExCNURVSEOiY2NhbmdzdG9yZS8qZHdpdGh4OGRpZDprZXk6ejZNa3VQZlpwVXoxcjRFakNxNmdwOWJHc1JqZ3dIMWJLYlZHcUV3WFRMQjVEVUhDomNjYW5odXBsb2FkLypkd2l0aHg4ZGlkOmtleTp6Nk1rdVBmWnBVejFyNEVqQ3E2Z3A5YkdzUmpnd0gxYktiVkdxRXdYVExCNURVSEOiY2NhbmhhY2Nlc3MvKmR3aXRoeDhkaWQ6a2V5Ono2TWt1UGZacFV6MXI0RWpDcTZncDliR3NSamd3SDFiS2JWR3FFd1hUTEI1RFVIQ6JjY2FuamZpbGVjb2luLypkd2l0aHg4ZGlkOmtleTp6Nk1rdVBmWnBVejFyNEVqQ3E2Z3A5YkdzUmpnd0gxYktiVkdxRXdYVExCNURVSEOiY2Nhbmd1c2FnZS8qZHdpdGh4OGRpZDprZXk6ejZNa3VQZlpwVXoxcjRFakNxNmdwOWJHc1JqZ3dIMWJLYlZHcUV3WFRMQjVEVUhDY2F1ZFgi7QHrHiIQiaXIhgGVmJNWt4bD/5VpNc0gQc4jp/1lp/536GNleHAaaj4B72NmY3SBoWVzcGFjZaFkbmFtZWVkZW1vNGNpc3NYIu0B3fOTfcMCWwCaVwaz3auXF5+L8iO0TUXtLDDoO/3McpdjcHJmgNQGAXESIHw4pb1+RurY+ihrhlbx/gOPT3oFYvc7uRxnecaWo7+CqGFzWETtoQNAUO7Z7LGUn6hkWFk6nBYsMjGJ06Pb09RQIeXzjDOraoVqjfPdI1Si2/xEByxT1IdjzHyUpuZa8tyGSXv2v/KIBWF2ZTAuOS4xY2F0dIiiY2NhbmdzcGFjZS8qZHdpdGh4OGRpZDprZXk6ejZNa3VQZlpwVXoxcjRFakNxNmdwOWJHc1JqZ3dIMWJLYlZHcUV3WFRMQjVEVUhDomNjYW5mYmxvYi8qZHdpdGh4OGRpZDprZXk6ejZNa3VQZlpwVXoxcjRFakNxNmdwOWJHc1JqZ3dIMWJLYlZHcUV3WFRMQjVEVUhDomNjYW5naW5kZXgvKmR3aXRoeDhkaWQ6a2V5Ono2TWt1UGZacFV6MXI0RWpDcTZncDliR3NSamd3SDFiS2JWR3FFd1hUTEI1RFVIQ6JjY2FuZ3N0b3JlLypkd2l0aHg4ZGlkOmtleTp6Nk1rdVBmWnBVejFyNEVqQ3E2Z3A5YkdzUmpnd0gxYktiVkdxRXdYVExCNURVSEOiY2Nhbmh1cGxvYWQvKmR3aXRoeDhkaWQ6a2V5Ono2TWt1UGZacFV6MXI0RWpDcTZncDliR3NSamd3SDFiS2JWR3FFd1hUTEI1RFVIQ6JjY2FuaGFjY2Vzcy8qZHdpdGh4OGRpZDprZXk6ejZNa3VQZlpwVXoxcjRFakNxNmdwOWJHc1JqZ3dIMWJLYlZHcUV3WFRMQjVEVUhDomNjYW5qZmlsZWNvaW4vKmR3aXRoeDhkaWQ6a2V5Ono2TWt1UGZacFV6MXI0RWpDcTZncDliR3NSamd3SDFiS2JWR3FFd1hUTEI1RFVIQ6JjY2FuZ3VzYWdlLypkd2l0aHg4ZGlkOmtleTp6Nk1rdVBmWnBVejFyNEVqQ3E2Z3A5YkdzUmpnd0gxYktiVkdxRXdYVExCNURVSENjYXVkWCLtAeseIhCJpciGAZWYk1a3hsP/lWk1zSBBziOn/WWn/nfoY2V4cBpqPgHvY2ZjdIGhZXNwYWNloWRuYW1lZWRlbW80Y2lzc1gi7QHd85N9wwJbAJpXBrPdq5cXn4vyI7RNRe0sMOg7/cxyl2NwcmaA1AYBcRIgfDilvX5G6tj6KGuGVvH+A49PegVi9zu5HGd5xpajv4KoYXNYRO2hA0BQ7tnssZSfqGRYWTqcFiwyMYnTo9vT1FAh5fOMM6tqhWqN890jVKLb/EQHLFPUh2PMfJSm5lry3IZJe/a/8ogFYXZlMC45LjFjYXR0iKJjY2FuZ3NwYWNlLypkd2l0aHg4ZGlkOmtleTp6Nk1rdVBmWnBVejFyNEVqQ3E2Z3A5YkdzUmpnd0gxYktiVkdxRXdYVExCNURVSEOiY2NhbmZibG9iLypkd2l0aHg4ZGlkOmtleTp6Nk1rdVBmWnBVejFyNEVqQ3E2Z3A5YkdzUmpnd0gxYktiVkdxRXdYVExCNURVSEOiY2NhbmdpbmRleC8qZHdpdGh4OGRpZDprZXk6ejZNa3VQZlpwVXoxcjRFakNxNmdwOWJHc1JqZ3dIMWJLYlZHcUV3WFRMQjVEVUhDomNjYW5nc3RvcmUvKmR3aXRoeDhkaWQ6a2V5Ono2TWt1UGZacFV6MXI0RWpDcTZncDliR3NSamd3SDFiS2JWR3FFd1hUTEI1RFVIQ6JjY2FuaHVwbG9hZC8qZHdpdGh4OGRpZDprZXk6ejZNa3VQZlpwVXoxcjRFakNxNmdwOWJHc1JqZ3dIMWJLYlZHcUV3WFRMQjVEVUhDomNjYW5oYWNjZXNzLypkd2l0aHg4ZGlkOmtleTp6Nk1rdVBmWnBVejFyNEVqQ3E2Z3A5YkdzUmpnd0gxYktiVkdxRXdYVExCNURVSEOiY2NhbmpmaWxlY29pbi8qZHdpdGh4OGRpZDprZXk6ejZNa3VQZlpwVXoxcjRFakNxNmdwOWJHc1JqZ3dIMWJLYlZHcUV3WFRMQjVEVUhDomNjYW5ndXNhZ2UvKmR3aXRoeDhkaWQ6a2V5Ono2TWt1UGZacFV6MXI0RWpDcTZncDliR3NSamd3SDFiS2JWR3FFd1hUTEI1RFVIQ2NhdWRYIu0B6x4iEImlyIYBlZiTVreGw/+VaTXNIEHOI6f9Zaf+d+hjZXhwGmo+Ae9jZmN0gaFlc3BhY2WhZG5hbWVlZGVtbzRjaXNzWCLtAd3zk33DAlsAmlcGs92rlxefi/IjtE1F7Sww6Dv9zHKXY3ByZoDUBgFxEiB8OKW9fkbq2Pooa4ZW8f4Dj096BWL3O7kcZ3nGlqO/gqhhc1hE7aEDQFDu2eyxlJ+oZFhZOpwWLDIxidOj29PUUCHl84wzq2qFao3z3SNUotv8RAcsU9SHY8x8lKbmWvLchkl79r/yiAVhdmUwLjkuMWNhdHSIomNjYW5nc3BhY2UvKmR3aXRoeDhkaWQ6a2V5Ono2TWt1UGZacFV6MXI0RWpDcTZncDliR3NSamd3SDFiS2JWR3FFd1hUTEI1RFVIQ6JjY2FuZmJsb2IvKmR3aXRoeDhkaWQ6a2V5Ono2TWt1UGZacFV6MXI0RWpDcTZncDliR3NSamd3SDFiS2JWR3FFd1hUTEI1RFVIQ6JjY2FuZ2luZGV4Lypkd2l0aHg4ZGlkOmtleTp6Nk1rdVBmWnBVejFyNEVqQ3E2Z3A5YkdzUmpnd0gxYktiVkdxRXdYVExCNURVSEOiY2NhbmdzdG9yZS8qZHdpdGh4OGRpZDprZXk6ejZNa3VQZlpwVXoxcjRFakNxNmdwOWJHc1JqZ3dIMWJLYlZHcUV3WFRMQjVEVUhDomNjYW5odXBsb2FkLypkd2l0aHg4ZGlkOmtleTp6Nk1rdVBmWnBVejFyNEVqQ3E2Z3A5YkdzUmpnd0gxYktiVkdxRXdYVExCNURVSEOiY2NhbmhhY2Nlc3MvKmR3aXRoeDhkaWQ6a2V5Ono2TWt1UGZacFV6MXI0RWpDcTZncDliR3NSamd3SDFiS2JWR3FFd1hUTEI1RFVIQ6JjY2FuamZpbGVjb2luLypkd2l0aHg4ZGlkOmtleTp6Nk1rdVBmWnBVejFyNEVqQ3E2Z3A5YkdzUmpnd0gxYktiVkdxRXdYVExCNURVSEOiY2Nhbmd1c2FnZS8qZHdpdGh4OGRpZDprZXk6ejZNa3VQZlpwVXoxcjRFakNxNmdwOWJHc1JqZ3dIMWJLYlZHcUV3WFRMQjVEVUhDY2F1ZFgi7QHrHiIQiaXIhgGVmJNWt4bD/5VpNc0gQc4jp/1lp/536GNleHAaaj4B72NmY3SBoWVzcGFjZaFkbmFtZWVkZW1vNGNpc3NYIu0B3fOTfcMCWwCaVwaz3auXF5+L8iO0TUXtLDDoO/3McpdjcHJmgJgJAXESIDQvtY85NGJrGXHscCIKjQKW3mNEQe7XD1kyYYMTDlFmqGFzWETtoQNA2YLqLhW7DSAElIkY1RqjteJMRsm/bF7TpJvHBCd202GbucZDhTReUp0+IPIAm6IGFaaq10lYdFNqEbSx8LCDD2F2ZTAuOS4xY2F0dIiiY2NhbmdzcGFjZS8qZHdpdGh4OGRpZDprZXk6ejZNa3VQZlpwVXoxcjRFakNxNmdwOWJHc1JqZ3dIMWJLYlZHcUV3WFRMQjVEVUhDomNjYW5mYmxvYi8qZHdpdGh4OGRpZDprZXk6ejZNa3VQZlpwVXoxcjRFakNxNmdwOWJHc1JqZ3dIMWJLYlZHcUV3WFRMQjVEVUhDomNjYW5naW5kZXgvKmR3aXRoeDhkaWQ6a2V5Ono2TWt1UGZacFV6MXI0RWpDcTZncDliR3NSamd3SDFiS2JWR3FFd1hUTEI1RFVIQ6JjY2FuZ3N0b3JlLypkd2l0aHg4ZGlkOmtleTp6Nk1rdVBmWnBVejFyNEVqQ3E2Z3A5YkdzUmpnd0gxYktiVkdxRXdYVExCNURVSEOiY2Nhbmh1cGxvYWQvKmR3aXRoeDhkaWQ6a2V5Ono2TWt1UGZacFV6MXI0RWpDcTZncDliR3NSamd3SDFiS2JWR3FFd1hUTEI1RFVIQ6JjY2FuaGFjY2Vzcy8qZHdpdGh4OGRpZDprZXk6ejZNa3VQZlpwVXoxcjRFakNxNmdwOWJHc1JqZ3dIMWJLYlZHcUV3WFRMQjVEVUhDomNjYW5qZmlsZWNvaW4vKmR3aXRoeDhkaWQ6a2V5Ono2TWt1UGZacFV6MXI0RWpDcTZncDliR3NSamd3SDFiS2JWR3FFd1hUTEI1RFVIQ6JjY2FuZ3VzYWdlLypkd2l0aHg4ZGlkOmtleTp6Nk1rdVBmWnBVejFyNEVqQ3E2Z3A5YkdzUmpnd0gxYktiVkdxRXdYVExCNURVSENjYXVkWCLtAeseIhCJpciGAZWYk1a3hsP/lWk1zSBBziOn/WWn/nfoY2V4cPZjZmN0gaFlc3BhY2WhZG5hbWVlZGVtbzRjaXNzWCLtAeseIhCJpciGAZWYk1a3hsP/lWk1zSBBziOn/WWn/nfoY3ByZojYKlglAAFxEiB8OKW9fkbq2Pooa4ZW8f4Dj096BWL3O7kcZ3nGlqO/gtgqWCUAAXESIHw4pb1+RurY+ihrhlbx/gOPT3oFYvc7uRxnecaWo7+C2CpYJQABcRIgfDilvX5G6tj6KGuGVvH+A49PegVi9zu5HGd5xpajv4LYKlglAAFxEiB8OKW9fkbq2Pooa4ZW8f4Dj096BWL3O7kcZ3nGlqO/gtgqWCUAAXESIHw4pb1+RurY+ihrhlbx/gOPT3oFYvc7uRxnecaWo7+C2CpYJQABcRIgfDilvX5G6tj6KGuGVvH+A49PegVi9zu5HGd5xpajv4LYKlglAAFxEiB8OKW9fkbq2Pooa4ZW8f4Dj096BWL3O7kcZ3nGlqO/gtgqWCUAAXESIHw4pb1+RurY+ihrhlbx/gOPT3oFYvc7uRxnecaWo7+C";

export const createDelegationWithCapabilities = async (
	config: StorachaConfig,
	{
		userDid,
		capabilities = ["space/info", "upload/add"],
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
	console.log("create delegation success", delegation);

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
	// console.log('proof cab', proof.capabilities);
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

	// Create delegation for the user
	const delegation = await createDelegationWithCapabilities(
		{
			client,
			spaceDid: space.did(),
		},
		{ userDid, capabilities: ["space/info", "upload/add"] },
	);

	console.log("delegation created successfully", delegation);

	return {
		delegation,
		client,
		space,
	};
};
