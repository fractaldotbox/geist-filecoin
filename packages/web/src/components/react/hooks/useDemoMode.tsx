import { useEffect, useRef } from "react";
import { useSearchParams } from "react-router";
import { useContentTypeSeeder } from "./useContentTypeSeeder";
import { useSpaceSeeder } from "./useSpaceSeeder";

// Hook to handle demo mode logic
export function useDemoMode() {
	const [searchParams] = useSearchParams();
	const isDemoMode = searchParams.get("demo") === "1";
	const isSeededRef = useRef(false);

	const { seedSpaces } = useSpaceSeeder();
	const { seedContentTypes } = useContentTypeSeeder();

	useEffect(() => {
		if (isDemoMode && !isSeededRef.current) {
			console.log("Demo mode enabled - seeding demo data");
			isSeededRef.current = true;

			// Seed spaces first, then content types
			seedSpaces();
			seedContentTypes();
		}
	}, [isDemoMode, seedSpaces, seedContentTypes]);

	return {
		isDemoMode,
	};
}
