import apiClient from "@/lib/api-client";
import { useStore } from "@livestore/react";
import ky from "ky";
import {
	createContext,
	useCallback,
	useContext,
	useEffect,
	useState,
} from "react";
import type { ReactNode } from "react";
import { firstSpace$ } from "../../livestore/queries";
import { useStorachaContext } from "./StorachaProvider";

// Auth context types
interface AuthUser {
	delegation: ArrayBuffer;
}

interface AuthContextType {
	user: AuthUser | null;
	isLoading: boolean;
	isAuthenticated: boolean;
	error: string | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Auth provider component
export function AuthProvider({ children }: { children: ReactNode }) {
	const { store } = useStore();
	const { client, clientId } = useStorachaContext();

	const activeSpace = store.useQuery(firstSpace$);
	const [user, setUser] = useState<AuthUser | null>(null);
	const [isLoading, setIsLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	// TODO authentication

	const value: AuthContextType = {
		user,
		isLoading,
		isAuthenticated: !!user,
		error,
	};

	return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// Hook to use auth context
export function useAuth() {
	const context = useContext(AuthContext);
	if (context === undefined) {
		throw new Error("useAuth must be used within an AuthProvider");
	}
	return context;
}

// HOC to wrap components with auth
export function withAuth<P extends object>(Component: React.ComponentType<P>) {
	return function AuthenticatedComponent(props: P) {
		return (
			<AuthProvider>
				<Component {...props} />
			</AuthProvider>
		);
	};
}
