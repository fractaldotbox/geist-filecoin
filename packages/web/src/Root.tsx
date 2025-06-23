import { makePersistedAdapter } from '@livestore/adapter-web'
import LiveStoreSharedWorker from '@livestore/adapter-web/shared-worker?sharedworker'
import { LiveStoreProvider } from '@livestore/react'
import type React from 'react'
import { unstable_batchedUpdates as batchUpdates } from 'react-dom'

import LiveStoreWorker from './livestore/livestore.worker?worker'
import { schema } from './livestore/schema.js'
import App from './App.js'


const adapter = makePersistedAdapter({
    storage: { type: 'opfs' },
    worker: LiveStoreWorker,
    sharedWorker: LiveStoreSharedWorker,
})

// fixed storeId across browser routes

export const AppWithLiveStore: React.FC = () => (
    <LiveStoreProvider
        schema={schema}
        storeId={import.meta.env.VITE_LIVESTORE_STORE_ID}
        adapter={adapter}
        renderLoading={(_) => <></>}
        batchUpdates={batchUpdates}
        syncPayload={{ authToken: 'insecure-token-change-me' }}
    >

        <App />
    </LiveStoreProvider>
)
