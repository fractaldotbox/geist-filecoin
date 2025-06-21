/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_STORACHA_KEY: string
  readonly VITE_STORACHA_PROOF: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
} 