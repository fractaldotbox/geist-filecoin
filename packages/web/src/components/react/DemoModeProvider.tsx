import { AlertTriangle, X } from "lucide-react";
import {
	type ReactNode,
	createContext,
	useContext,
	useEffect,
	useRef,
	useState,
} from "react";
import { useSearchParams } from "react-router-dom";
import { useContentTypeSeeder } from "./hooks/useContentTypeSeeder";
import { useSpaceSeeder } from "./hooks/useSpaceSeeder";
import { Alert, AlertDescription } from "./ui/alert";
import { Button } from "./ui/button";

interface DemoModeContextType {
	isDemoMode: boolean;
}

// Create context
const DemoModeContext = createContext<DemoModeContextType | null>(null);

// Hook to use the context
export function useDemoMode() {
	const context = useContext(DemoModeContext);
	if (!context) {
		throw new Error("useDemoMode must be used within DemoModeProvider");
	}
	return context;
}

// Banner component (internal)
function DemoModeBanner({
	isDemoMode,
}: {
	isDemoMode: boolean;
}) {
	return (
		<Alert className="rounded-none border-x-0 border-t-0 bg-amber-50 border-amber-200 dark:bg-amber-950/20 dark:border-amber-800">
			<AlertTriangle className="h-4 w-4 text-amber-600 dark:text-amber-400" />
			<AlertDescription className="text-amber-800 dark:text-amber-300 flex items-center justify-between w-full">
				<div className="flex items-center gap-2">
					<strong>Demo Mode Active</strong>
					<span>•</span>
					<span>Sample data has been loaded automatically</span>
				</div>
			</AlertDescription>
		</Alert>
	);
}

// Provider component
interface DemoModeBannerProviderProps {
	children: ReactNode;
}

export function DemoModeProvider({ children }: DemoModeBannerProviderProps) {
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

	const value: DemoModeContextType = {
		isDemoMode,
	};

	return (
		<DemoModeContext.Provider value={value}>
			<DemoModeBanner isDemoMode={isDemoMode} />
			{children}
		</DemoModeContext.Provider>
	);
}
