import { useAuth } from "./AuthProvider";

export function AuthStatus() {
    const { user, isLoading, isAuthenticated, error, refetch } = useAuth();

    if (isLoading) {
        return (
            <div className="flex items-center space-x-2">
                <div className="w-4 h-4 border-2 border-muted border-t-primary rounded-full animate-spin" />
                <span className="text-sm text-muted-foreground">Checking authentication...</span>
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex items-center justify-between bg-destructive/10 border border-destructive/20 rounded-md p-3">
                <div className="flex items-center space-x-2">
                    <span className="text-sm text-destructive">Auth Error: {error}</span>
                </div>
                <button
                    type="button"
                    onClick={refetch}
                    className="text-xs bg-destructive/20 hover:bg-destructive/30 px-2 py-1 rounded"
                >
                    Retry
                </button>
            </div>
        );
    }

    return (
        <div className="flex items-center justify-between bg-muted/50 rounded-md p-3">
            <div className="flex items-center space-x-2">
                <div
                    className={`w-2 h-2 rounded-full ${isAuthenticated ? "bg-green-500" : "bg-red-500"
                        }`}
                />
                <span className="text-sm">
                    {isAuthenticated ? `Authenticated as ${user?.email || user?.name || user?.id}` : "Not authenticated"}
                </span>
            </div>
            <button
                type="button"
                onClick={refetch}
                className="text-xs bg-primary/10 hover:bg-primary/20 px-2 py-1 rounded"
            >
                Refresh
            </button>
        </div>
    );
} 