import ky from "ky";
import { createContext, useCallback, useContext, useEffect, useState } from "react";
import type { ReactNode } from "react";

// Auth context types
interface AuthUser {
    id: string;
    email?: string;
    name?: string;
    [key: string]: any;
}

interface AuthResponse {
    user?: AuthUser;
}

interface AuthContextType {
    user: AuthUser | null;
    isLoading: boolean;
    isAuthenticated: boolean;
    error: string | null;
    refetch: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const API_URL = "http://localhost:8787";

// Auth provider component
export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<AuthUser | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchAuth = useCallback(async () => {
        try {
            setIsLoading(true);
            setError(null);
            const authData = await ky.post(`${API_URL}/api/auth`, {
                json: {
                    spaceId: localStorage.getItem("activeSpaceKey") || "",
                }
            }).json<AuthResponse>();
            console.log("authData", authData);

            // Handle both { user: {...} } and direct user object formats
            const userData = authData.user || (authData.id ? authData as AuthUser : null);
            setUser(userData);
        } catch (err) {
            console.error(err);
            setUser(null);
        } finally {
            setIsLoading(false);
        }
    }, []);

    const refetch = async () => {
        await fetchAuth();
    };

    // Fetch auth on mount
    useEffect(() => {
        fetchAuth();
    }, [fetchAuth]);

    const value: AuthContextType = {
        user,
        isLoading,
        isAuthenticated: !!user,
        error,
        refetch,
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
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