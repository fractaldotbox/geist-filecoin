import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import "./styles/global.css";
import App from './App.tsx'
import { AppWithLiveStore } from './Root.tsx'
import { BrowserRouter } from 'react-router-dom'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <AppWithLiveStore />
    </BrowserRouter>
  </StrictMode>,
)


