import { makeDurableObject, makeWorker } from "@livestore/sync-cf/cf-worker";
import { createClient, createDelegation, initStorachaClient, createUserDelegation } from "@geist-filecoin/storage";

import { Router, cors, error, json } from 'itty-router'

const { preflight, corsify } = cors({
	origin: '*',
	credentials: true,
	allowMethods: ['GET', 'POST', 'OPTIONS']
})


export class WebSocketServer extends makeDurableObject({
	onPush: async (message) => {
		console.log("onPush", message.batch);
	},
	onPull: async (message) => {
		console.log("onPull", message);
	},
}) {}


// Note AutoRouter not compatabile
const worker = makeWorker({
	validatePayload: (payload: any) => {
		if (payload?.authToken !== "insecure-token-change-me") {
			throw new Error("Invalid auth token");
		}
	},
	enableCORS: true,
});

const router = Router({
	before: [preflight],
	catch: error,
	finally: [ corsify],
});


router.post("/api/upload", async (request: Request) => {

	console.log("upload");

	return new Response(JSON.stringify({ message: "Uploaded" }), {
		headers: {
			"Content-Type": "application/json",
		},
	});

});

router.post("/api/auth", async (request: Request) => {

	const { did } = await request.json();
	// TODO remove hardcode and use secrets provider

	// we could have 3 different agents (keys)
	// space owner - delegated to server
	// server agent - received delgation
	// user agent requesting delegation to the space

	// TODO provision from secrets
	const agentKeyString = 'MgCaBWKgYhZe8Bdg3EaCqGk24BRGBbfI2IMmx8CH64T1Ky+0BoA1e7a+Xr4ypcIa9d7TBJvWkTWum49+xYig+6X8mHL0=';
	const proofString = 'mAYIEAOkNEaJlcm9vdHOAZ3ZlcnNpb24B1wYBcRIgkfGpMTHF2aIaf8V16vW+rbPKzQOYYk/iS9htpNZQsweoYXNYRO2hA0Bbcn3mrqhaij34QJf224pGDaWzHZj4lQI2R3CANd498PP7fRVzq5MO9AHc4Y4INKt3E31fjwfaJ15UP/T2uI0GYXZlMC45LjFjYXR0iKJjY2FuZ3NwYWNlLypkd2l0aHg4ZGlkOmtleTp6Nk1rdnU1N3BtMlhhUVlyMjhSQXhSbk1abXA4b3djZjJFdEQ3TVQ4RnNNVnhDbmqiY2NhbmZibG9iLypkd2l0aHg4ZGlkOmtleTp6Nk1rdnU1N3BtMlhhUVlyMjhSQXhSbk1abXA4b3djZjJFdEQ3TVQ4RnNNVnhDbmqiY2NhbmdpbmRleC8qZHdpdGh4OGRpZDprZXk6ejZNa3Z1NTdwbTJYYVFZcjI4UkF4Um5NWm1wOG93Y2YyRXREN01UOEZzTVZ4Q25qomNjYW5nc3RvcmUvKmR3aXRoeDhkaWQ6a2V5Ono2TWt2dTU3cG0yWGFRWXIyOFJBeFJuTVptcDhvd2NmMkV0RDdNVDhGc01WeENuaqJjY2FuaHVwbG9hZC8qZHdpdGh4OGRpZDprZXk6ejZNa3Z1NTdwbTJYYVFZcjI4UkF4Um5NWm1wOG93Y2YyRXREN01UOEZzTVZ4Q25qomNjYW5oYWNjZXNzLypkd2l0aHg4ZGlkOmtleTp6Nk1rdnU1N3BtMlhhUVlyMjhSQXhSbk1abXA4b3djZjJFdEQ3TVQ4RnNNVnhDbmqiY2NhbmpmaWxlY29pbi8qZHdpdGh4OGRpZDprZXk6ejZNa3Z1NTdwbTJYYVFZcjI4UkF4Um5NWm1wOG93Y2YyRXREN01UOEZzTVZ4Q25qomNjYW5ndXNhZ2UvKmR3aXRoeDhkaWQ6a2V5Ono2TWt2dTU3cG0yWGFRWXIyOFJBeFJuTVptcDhvd2NmMkV0RDdNVDhGc01WeENuamNhdWRYIu0BGwYocUTkMpU/SEgOFawT3688VMUU9w3qV7cLNmhuHkBjZXhwGmo+OrJjZmN0gaFlc3BhY2WhZG5hbWVoZGVtbzA2MjZjaXNzWCLtAfRXvJRpw3FVXGmhqbF9djRuqT8yO1ToIplqHACZIi5AY3ByZoD8BgFxEiBxLsPcdVEFYsFFrlz+3kuModW5aOKe3z2KNoBTN2SpzKhhc1hE7aEDQKGdSP54m3BZ05nm6baRLfGQFEJ9qOnhGZaPhXHIrj+7chtyHseFhNKknucgSJnsHKm6h5rV5JL24A5VzFBk8wphdmUwLjkuMWNhdHSIomNjYW5nc3BhY2UvKmR3aXRoeDhkaWQ6a2V5Ono2TWt2dTU3cG0yWGFRWXIyOFJBeFJuTVptcDhvd2NmMkV0RDdNVDhGc01WeENuaqJjY2FuZmJsb2IvKmR3aXRoeDhkaWQ6a2V5Ono2TWt2dTU3cG0yWGFRWXIyOFJBeFJuTVptcDhvd2NmMkV0RDdNVDhGc01WeENuaqJjY2FuZ2luZGV4Lypkd2l0aHg4ZGlkOmtleTp6Nk1rdnU1N3BtMlhhUVlyMjhSQXhSbk1abXA4b3djZjJFdEQ3TVQ4RnNNVnhDbmqiY2NhbmdzdG9yZS8qZHdpdGh4OGRpZDprZXk6ejZNa3Z1NTdwbTJYYVFZcjI4UkF4Um5NWm1wOG93Y2YyRXREN01UOEZzTVZ4Q25qomNjYW5odXBsb2FkLypkd2l0aHg4ZGlkOmtleTp6Nk1rdnU1N3BtMlhhUVlyMjhSQXhSbk1abXA4b3djZjJFdEQ3TVQ4RnNNVnhDbmqiY2NhbmhhY2Nlc3MvKmR3aXRoeDhkaWQ6a2V5Ono2TWt2dTU3cG0yWGFRWXIyOFJBeFJuTVptcDhvd2NmMkV0RDdNVDhGc01WeENuaqJjY2FuamZpbGVjb2luLypkd2l0aHg4ZGlkOmtleTp6Nk1rdnU1N3BtMlhhUVlyMjhSQXhSbk1abXA4b3djZjJFdEQ3TVQ4RnNNVnhDbmqiY2Nhbmd1c2FnZS8qZHdpdGh4OGRpZDprZXk6ejZNa3Z1NTdwbTJYYVFZcjI4UkF4Um5NWm1wOG93Y2YyRXREN01UOEZzTVZ4Q25qY2F1ZFgi7QGgDV7tr5evjKlwhr13tMEm9aRNa6bj37FiKD7pfyYcvWNleHD2Y2ZjdIGhZXNwYWNloWRuYW1laGRlbW8wNjI2Y2lzc1gi7QEbBihxROQylT9ISA4VrBPfrzxUxRT3DepXtws2aG4eQGNwcmaB2CpYJQABcRIgkfGpMTHF2aIaf8V16vW+rbPKzQOYYk/iS9htpNZQswc';

	try {
		
		const { delegation } = await createUserDelegation({
			userDid: did,
			serverAgentKeyString: agentKeyString,
			proofString,
		});
	
		return new Response(
			delegation,
			{
				headers: {
				  'Content-Type': 'application/octet-stream',
				  'Content-Length': delegation.byteLength.toString()
				},
			}
		)
	} catch (error) {
		console.log('error', error);
		const errorMessage = error instanceof Error ? error.message : 'Unknown error';
		return new Response(JSON.stringify({ error: errorMessage }), {
			status: 500,
			headers: {
				"Content-Type": "application/json",
			},
		});
	}
});

// Fallback to original worker for all other routes
router.all("*", (request: Request, env: any, ctx: any) => {
	return worker.fetch(request, env, ctx);
});

export default {
	...worker,
	fetch: (request: Request, env: any, ctx: any) => {
		return router.fetch(request, env, ctx);
	},
}; 