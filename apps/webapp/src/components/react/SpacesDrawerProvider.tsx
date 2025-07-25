import { createContext, useContext, useState } from "react";
import type { ReactNode } from "react";

// Create context for spaces drawer
const SpacesDrawerContext = createContext<{
    openSpacesDrawer: () => void;
    isSpacesDrawerOpen: boolean;
    closeSpacesDrawer: () => void;
} | null>(null);

export const useSpacesDrawer = () => {
    const context = useContext(SpacesDrawerContext);
    if (!context) {
        throw new Error("useSpacesDrawer must be used within SpacesDrawerProvider");
    }
    return context;
};

interface SpacesDrawerProviderProps {
    children: ReactNode;
}

export const SpacesDrawerProvider = ({ children }: SpacesDrawerProviderProps) => {
    const [isSpacesDrawerOpen, setIsSpacesDrawerOpen] = useState(false);

    const openSpacesDrawer = () => {
        setIsSpacesDrawerOpen(true);
    };

    const closeSpacesDrawer = () => {
        setIsSpacesDrawerOpen(false);
    };

    return (
        <SpacesDrawerContext.Provider value={{
            openSpacesDrawer,
            isSpacesDrawerOpen,
            closeSpacesDrawer
        }}>
            {children}
        </SpacesDrawerContext.Provider>
    );
}; 