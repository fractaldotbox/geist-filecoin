import { useLiveStore } from "@/components/react/hooks/useLiveStore";
import { useSpaceStore } from "@/components/react/hooks/useSpaceStore";
import { StorageProvider } from "@/constants/storage-providers";
import { allSpaces$ } from "@/livestore/queries";
import { useStore } from "@livestore/react";

// Sample space configurations for different use cases
const SAMPLE_SPACES = [
	{
		id: "demo-space",
		name: "Demo Space",
		description: "A demo space for blog content using Storacha storage",
		storageProvider: StorageProvider.STORACHA,
		spaceKey: "did:key:z6Mkvu57pm2XaQYr28RAxRnMZmp8owcf2EtD7MT8FsMVxCnj",
		spaceProof: "mAYIEAOkNEaJlcm9vdHOAZ3ZlcnNpb24B1wYBcRIgkfGpMTHF2aIaf8V16vW+rbPKzQOYYk/iS9htpNZQsweoYXNYRO2hA0Bbcn3mrqhaij34QJf224pGDaWzHZj4lQI2R3CANd498PP7fRVzq5MO9AHc4Y4INKt3E31fjwfaJ15UP/T2uI0GYXZlMC45LjFjYXR0iKJjY2FuZ3NwYWNlLypkd2l0aHg4ZGlkOmtleTp6Nk1rdnU1N3BtMlhhUVlyMjhSQXhSbk1abXA4b3djZjJFdEQ3TVQ4RnNNVnhDbmqiY2NhbmZibG9iLypkd2l0aHg4ZGlkOmtleTp6Nk1rdnU1N3BtMlhhUVlyMjhSQXhSbk1abXA4b3djZjJFdEQ3TVQ4RnNNVnhDbmqiY2NhbmdpbmRleC8qZHdpdGh4OGRpZDprZXk6ejZNa3Z1NTdwbTJYYVFZcjI4UkF4Um5NWm1wOG93Y2YyRXREN01UOEZzTVZ4Q25qomNjYW5nc3RvcmUvKmR3aXRoeDhkaWQ6a2V5Ono2TWt2dTU3cG0yWGFRWXIyOFJBeFJuTVptcDhvd2NmMkV0RDdNVDhGc01WeENuaqJjY2FuaHVwbG9hZC8qZHdpdGh4OGRpZDprZXk6ejZNa3Z1NTdwbTJYYVFZcjI4UkF4Um5NWm1wOG93Y2YyRXREN01UOEZzTVZ4Q25qomNjYW5oYWNjZXNzLypkd2l0aHg4ZGlkOmtleTp6Nk1rdnU1N3BtMlhhUVlyMjhSQXhSbk1abXA4b3djZjJFdEQ3TVQ4RnNNVnhDbmqiY2NhbmpmaWxlY29pbi8qZHdpdGh4OGRpZDprZXk6ejZNa3Z1NTdwbTJYYVFZcjI4UkF4Um5NWm1wOG93Y2YyRXREN01UOEZzTVZ4Q25qomNjYW5ndXNhZ2UvKmR3aXRoeDhkaWQ6a2V5Ono2TWt2dTU3cG0yWGFRWXIyOFJBeFJuTVptcDhvd2NmMkV0RDdNVDhGc01WeENuamNhdWRYIu0BGwYocUTkMpU/SEgOFawT3688VMUU9w3qV7cLNmhuHkBjZXhwGmo+OrJjZmN0gaFlc3BhY2WhZG5hbWVoZGVtbzA2MjZjaXNzWCLtAfRXvJRpw3FVXGmhqbF9djRuqT8yO1ToIplqHACZIi5AY3ByZoD8BgFxEiBxLsPcdVEFYsFFrlz+3kuModW5aOKe3z2KNoBTN2SpzKhhc1hE7aEDQKGdSP54m3BZ05nm6baRLfGQFEJ9qOnhGZaPhXHIrj+7chtyHseFhNKknucgSJnsHKm6h5rV5JL24A5VzFBk8wphdmUwLjkuMWNhdHSIomNjYW5nc3BhY2UvKmR3aXRoeDhkaWQ6a2V5Ono2TWt2dTU3cG0yWGFRWXIyOFJBeFJuTVptcDhvd2NmMkV0RDdNVDhGc01WeENuaqJjY2FuZmJsb2IvKmR3aXRoeDhkaWQ6a2V5Ono2TWt2dTU3cG0yWGFRWXIyOFJBeFJuTVptcDhvd2NmMkV0RDdNVDhGc01WeENuaqJjY2FuZ2luZGV4Lypkd2l0aHg4ZGlkOmtleTp6Nk1rdnU1N3BtMlhhUVlyMjhSQXhSbk1abXA4b3djZjJFdEQ3TVQ4RnNNVnhDbmqiY2NhbmdzdG9yZS8qZHdpdGh4OGRpZDprZXk6ejZNa3Z1NTdwbTJYYVFZcjI4UkF4Um5NWm1wOG93Y2YyRXREN01UOEZzTVZ4Q25qomNjYW5odXBsb2FkLypkd2l0aHg4ZGlkOmtleTp6Nk1rdnU1N3BtMlhhUVlyMjhSQXhSbk1abXA4b3djZjJFdEQ3TVQ4RnNNVnhDbmqiY2NhbmhhY2Nlc3MvKmR3aXRoeDhkaWQ6a2V5Ono2TWt2dTU3cG0yWGFRWXIyOFJBeFJuTVptcDhvd2NmMkV0RDdNVDhGc01WeENuaqJjY2FuamZpbGVjb2luLypkd2l0aHg4ZGlkOmtleTp6Nk1rdnU1N3BtMlhhUVlyMjhSQXhSbk1abXA4b3djZjJFdEQ3TVQ4RnNNVnhDbmqiY2Nhbmd1c2FnZS8qZHdpdGh4OGRpZDprZXk6ejZNa3Z1NTdwbTJYYVFZcjI4UkF4Um5NWm1wOG93Y2YyRXREN01UOEZzTVZ4Q25qY2F1ZFgi7QGgDV7tr5evjKlwhr13tMEm9aRNa6bj37FiKD7pfyYcvWNleHD2Y2ZjdIGhZXNwYWNloWRuYW1laGRlbW8wNjI2Y2lzc1gi7QEbBihxROQylT9ISA4VrBPfrzxUxRT3DepXtws2aG4eQGNwcmaB2CpYJQABcRIgkfGpMTHF2aIaf8V16vW+rbPKzQOYYk/iS9htpNZQswc",
		isActive: false,
	},
] as const;

export function useSpaceSeeder() {
	const { store } = useStore();
	const { createSpace } = useSpaceStore();
	const existingSpaces = store.useQuery(allSpaces$);

	const seedSpaces = () => {
		if (existingSpaces.length > 0) {
			return;
		}

		SAMPLE_SPACES.map(({ id, name, description, storageProvider, spaceKey, spaceProof, isActive }) => {
			// Create storage provider credentials for Storacha
			const storageProviderCredentials = JSON.stringify({
				spaceKey,
			});

			createSpace({
				id,
				name,
				description,
				storageProvider,
				storageProviderCredentials,
				spaceProof,
				isActive,
			});
		});
	};

	return { seedSpaces };
}
