import {
	Signer,
	type DID as W3DID,
} from "@web3-storage/w3up-client/principal/ed25519";
import * as Proof from "@web3-storage/w3up-client/proof";
import type {
	Client,
	EmailAddress,
} from "@web3-storage/w3up-client/types";


import * as DID from "@ipld/dag-ucan/did";
import type { ServiceAbility } from "@web3-storage/w3up-client/types";

// import * as DID from "@ipld/dag-ucan/did";
import { create } from "@web3-storage/w3up-client";
import { StoreMemory } from "@web3-storage/w3up-client/stores/memory";

// enable sync methods
import * as ed from "@noble/ed25519";
import { sha512 } from "@noble/hashes/sha512";
import type { Config } from "../config";

export type StorachaInitParams = {
	keyString: string;
	proofString: string;
	store?: StoreMemory;
};


//@ts-ignore
ed.etc.sha512Sync = (...m) => sha512(ed.etc.concatBytes(...m));

export interface StorachaConfig {
	client: Client;
	spaceDid: W3DID;
}

export const loadStorachaConfig = (config: Config) => {

	const {keyString, proofString} = config.storacha;
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

/**
 * Create delegation to agent DID from existing space
 */
export const createDelegation = async (
	config: StorachaConfig,
	{
		userDid,
	}: {
		userDid: string;
	},
	{
		expiration
	}: {
		expiration?: number;
	}
) => {
	const { client } = config;

	const audience = DID.parse(userDid);
	console.log("create delegation", audience.did());

	const abilities = [
		"space/blob/add",
		"space/index/add",
		"filecoin/offer",
		"upload/add",
	] as ServiceAbility[];
	const delegation = await client.createDelegation(audience, abilities, {
		expiration: expiration || Math.floor(Date.now() / 1000) + 60 * 60 * 24,
	});

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

	console.log(
		`storcha init: principal ${principal.did()} space ${space.did()}`,
	);

	return {
		client,
		space,
	};
};
