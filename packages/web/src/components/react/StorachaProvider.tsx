import { Provider } from "@w3ui/react";
import type { ReactNode } from "react";
import { useDelegateAccount } from "./hooks/useStoracha.js";

export { useDelegateAccount } from "./hooks/useStoracha.js";

interface StorachaProviderProps {
    children: ReactNode;
}

export const StorachaProvider: React.FC<StorachaProviderProps> = ({ children }) => {

    useDelegateAccount()
    return (
        <Provider>
            {children}
        </Provider>
    );
}; 