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
import { firstActiveSpace$ } from "../../livestore/queries";
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

const API_URL = "http://localhost:8787";

// Auth provider component
export function AuthProvider({ children }: { children: ReactNode }) {
	const { store } = useStore();
	const { client, clientId } = useStorachaContext();

	const activeSpace = store.useQuery(firstActiveSpace$);
	const [user, setUser] = useState<AuthUser | null>(null);
	const [isLoading, setIsLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	// TODO decouple with storacha
	const fetchAuth = useCallback(
		async (clientId: string) => {
			try {
				setIsLoading(true);
				setError(null);

				const delegation = await ky
					.post(`${API_URL}/api/auth`, {
						json: {
							did: clientId,
							spaceId: activeSpace?.id || "",
						},
					})
					.arrayBuffer();

				const userData = {
					delegation,
				};
				setUser(userData);
			} catch (err) {
				console.error(err);
				setUser(null);
			} finally {
				setIsLoading(false);
			}
		},
		[activeSpace?.id],
	);

	// Fetch auth on mount and when active space changes
	useEffect(() => {
		if (!clientId) {
			return;
		}
		fetchAuth(clientId);
	}, [clientId, fetchAuth]);

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
