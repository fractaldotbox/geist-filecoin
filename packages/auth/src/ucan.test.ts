import { match } from "ts-pattern";
import { beforeEach, describe, expect, it } from "vitest";
import { processPolicies } from "./policy-engine";
import type { AccessPolicy, AuthInput } from "./schemas/access-policy";
import test from "node:test";
import { verifyUcan } from "./ucan";
import {  UCAN_PROOFS_FIXTURE_BASE64 } from "./ucan.fixture";
import { Delegation } from "@ucanto/core";
import * as Proof from "@web3-storage/w3up-client/proof";

describe("processPolicies", () => {
	let mockAuthInput: AuthInput;
	let envPolicy: AccessPolicy;
    

test('parse delegation', async ()=>{
    const proof = 'OqJlcm9vdHOB2CpYJQABcRIg4Gw6pcWMzXMQD1dutbp7XmQOuxfC9/qHrx8kfGEhetRndmVyc2lvbgGIBAFxEiCaga3ctYbJirrzSWYQAt81ZDmfeJnl6oaceNIbuXkqAahhc0SAoAMAYXZlMC45LjFjYXR0gaJjY2FuYSpkd2l0aGZ1Y2FuOipjYXVkWQEQhSQwggEKAoIBAQCYdsccn664R1Tm3Q2Yf51vrkTmJcOZqISxeMy4XH+tt7SuFKYtxSh/JMTq/l3Br458gfqkWy6DXLXyXENPQ8qWn92jS7ZbYx3PRPAkY6S81fjxipV3YDlf9LsfY0nEi0itQ79COhyF/2NGQ13Qf+irPE7wQNpLESxP8HahdDZT+x/XabwP/r4Zj6ZYAXJoLQUSQSY6oRaJKrMnIECo+QJfXv3SlDzPE64yrDhfBPg4vf1aIL1e600n2wJsv9nfypEQdPf2xs/l2V4qhx8oq3sMi9oP9qh4FSwGd6rTKQi7D8HW6vzt9uSYnK9bPbyg0PRcHi4VXmbZKBN4DxbmCKPRAgMBAAFjZXhw9mNmY3SBom5hY2Nlc3MvY29uZmlybdgqWCUAAXESIO/CLM8iHEyAo3QOQqWRtoDgwnphIa4XjKcN7naCPShgbmFjY2Vzcy9yZXF1ZXN02CpYJQABcRIgYs6tWhxbeL3YxFCu36aiMfUsMbwSPUQWD/nTE1zhX/5jaXNzWB+dGm1haWx0bzpkZWJ1Z2dpbmdmdXR1cmUuY29tOmhpY3ByZoBZAXESIOBsOqXFjM1zEA9XbrW6e15kDrsXwvf6h68fJHxhIXrUoWp1Y2FuQDAuOS4x2CpYJQABcRIgmoGt3LWGyYq680lmEALfNWQ5n3iZ5eqGnHjSG7l5KgE=';

    const proofBuffer = Buffer.from(proof, 'base64');

    const delegation = await Delegation.extract(proofBuffer);

    console.log('delegation', delegation)


    expect(delegation.ok).toBeDefined()

    const delegationWithStoracahProof = await Proof.parse(proof);

    expect(delegationWithStoracahProof.root).toBeDefined()

})

test("verify ucan", async () => {   

    // const rootProof = "bafyreie2qgw5znmgzgflv42jmyiafxzvmq4z66ez4xvinhdy2in3s6jkae";

    const proofs = await Promise.all(UCAN_PROOFS_FIXTURE_BASE64.split(",").map(async p=>{
        const delegation = await Delegation.extract(Buffer.from(p, 'base64'));
console.log('parsed', delegation.ok)
        return delegation.ok;
    } ));

    console.log("proofs", proofs)
    const input = {
        agentDid: "did:key:z4MXj1wBzi9jUstyNmjKfeZcLTaPupodBbLTttuqoWESMQTMXa8TyLJXNjao7vDrM4bopmhxNyy4ChP7EHxD6xa9GqD4W1bHoHH7gaF4m71bq3ef62hF3YAsGthFeGeKDrXSY7CbpMfuSEJwaGeZ5tGp3XHnTpjsKwcpMU97Sivr3FHTL26byszNAkg95g8cjYtvgpJdBRjJpxJXLn2GurFhbjzgSoH3pxFDebRyqvZ5TNsrVYHxPs4H1kQpsifsDspH8bqKa2mUMpa1jsnxmwQ8fufm5scFTjAA8xHWzhmR9k7dym8bSgqdotWi7aomQdPv83cAf87GvxuPnQSrdWyLoCBFuYH28t1B2dqbuuShfRTYJXQvc",
        userDid: "did:mailto:debuggingfuture.com:hi",
       
    }
    const result = await verifyUcan(input, proofs);

    console.log('result', result.error.cause)
    expect(result).toBe(true)
})
});