import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import './styles/global.css'
import { AppWithLiveStore } from './Root.tsx'

const rootElement = document.getElementById('root')
if (!rootElement) {
    throw new Error('Root element not found')
}

ReactDOM.createRoot(rootElement).render(
    <React.StrictMode>
        <BrowserRouter>
            <AppWithLiveStore />
        </BrowserRouter>
    </React.StrictMode>,
) 