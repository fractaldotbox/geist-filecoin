

export const getConfig = () => {

    return {
        storacha: {
            keyString: import.meta.env.VITE_STORACHA_KEY,
            proofString: import.meta.env.VITE_STORACHA_PROOF,
        }

    }

}

export type Config = ReturnType<typeof getConfig>;