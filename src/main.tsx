import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import '@/index.css'
import App from '@/App'
import { startRouter } from '@/store/router'
import { rememberScanDebug } from '@/store/scanStore'

// The scan's debug asked in the address, before the router rewrites it.
rememberScanDebug()
// The address says which language and puzzle to show, before the first render.
startRouter()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
