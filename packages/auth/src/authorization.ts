export const createSpaceAuthorization = async (did: string) => {

if (!did) {
    return new Response("Missing DID", {
        status: 500,
    });
}
const { keyString, proofString } = loadStorachaConfig();

const { client, space } = await initStorachaClient({
    keyString,
    proofString,
});

const delegationResults = await createDelegation(
    {
        client,
        spaceDid: space.did(),
    },
    {
        userDid: did,
    },
);



}


// Either 1. jwt based service token 2. ucan proof