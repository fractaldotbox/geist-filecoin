import {
	type MockedFunction,
	beforeEach,
	describe,
	expect,
	it,
	vi,
} from "vitest";
import { type DelegationFlowParams, createUserDelegation } from "./storacha";

describe("createUserDelegation", () => {
	const userDid =
		"did:key:z4MXj1wBzi9jUstyQoLeoP34wjiR99RYNxg83VfPkkMo1zSbZidnjv1k2zoQmYBKznvzjx1YvFXNGTTy18FXiuJRHSPvjypasT4JLsiQHepPVPCFtFFEZHjaPMwKcj4FhQX3quNwmePpDxNtqScrhSSzq1i4WvYhLdNDdT3ZM1dnv5LBhzwj1NY5wJ48gmxz59TSk25hxCkR9rAtRef83Go1rEYP5GzNbqNXQzpehGT2tFo7EvT2MedybzZKSk8FB7xoukMLhRPJWfTY4A5b3oXD5B9pZv2N3pXSU8LagLTgGwYxF6ZFWugT8CupN7rj3eFuvQd6hFeFAHPa3Uu4irFaiqKpF1PdY5WsPWTufxnmVDhBmUz8p";

	it.skip("delegate space issued by others", async () => {
		const params: DelegationFlowParams = {
			userDid,
			serverAgentKeyString: "",
			proofString: "",
		};

		const { space, delegation } = await createUserDelegation(params);
		expect(space.did()).toEqual(
			"did:key:z6Mkvu57pm2XaQYr28RAxRnMZmp8owcf2EtD7MT8FsMVxCnj",
		);
	});
});
