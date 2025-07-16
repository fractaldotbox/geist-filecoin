/**
 * Verify ucan
 * Currently accept
 * 
 */
import { ed25519 } from "@ucanto/principal"
import { access, capability, claim, DID, Principal, Schema } from "@ucanto/validator";
import { Verifier } from "@ucanto/principal";


export const service = ed25519.parse(
    'MgCYKXoHVy7Vk4/QjcEGi+MCqjntUiasxXJ8uJKY0qh11e+0Bs8WsdqGK7xothgrDzzWD0ME7ynPjz2okXDh8537lId8='
  )

  
import * as Proof from "@web3-storage/w3up-client/proof";

export type UCanAuthInput = {
    agentDid: string;
    userDid: `did:mailto:${string}`;

}

const STORACHA_NETWORK_DID = 'did:web:up.storacha.network'

// user mailto: -> agent did
// we want claim/ storacha network => agent did

// user present proofs
// knows delegation required as cid

// can we get the "/": "bafyreie2qgw5znmgzgflv42jmyiafxzvmq4z66ez4xvinhdy2in3s6jkae" from user give mailto did?

export const verifyUcan =async (input: UCanAuthInput, proofs: any[]) => {

    const { agentDid, userDid } = input;


    const userAttestation = capability({
        // with: Schema.literal("ucan:*"),
        with: STORACHA_NETWORK_DID as any,
        can: 'ucan/attest',
        nb: Schema.struct({
            proof: Schema.link(),
        }),
        
      })

    // const attestation = capability({
    //     with: Schema.literal(agentDid),
    //     can: 'ucan/attest',
    //     nb: Schema.struct({
    //       proof: Schema.link(delegation.cid),
    //     }),
    //   })


    console.log('verifyucan', service)
    const results = await claim(userAttestation, proofs,{

        authority: service,

            // authority: w3,
    principal: Verifier,

        // authority: DID.from(STORACHA_NETWORK_DID) as any,
        // principal: userDid as any,
        validateAuthorization: (auth) => {
            console.log(auth)
            return { ok: {} }
        }
    })

    console.log('results', results)

    return results;
}