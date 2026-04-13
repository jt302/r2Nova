import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'
import './styles/globals.css'
import { moduleManager } from './ulw'
import { loggerService } from './services/loggerService'

moduleManager.register(loggerService)
moduleManager.initAll().then(() => {
  moduleManager.startAll()
})

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>
)
