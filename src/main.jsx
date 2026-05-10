import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { PrimeReactProvider } from 'primereact/api'
import './index.css'
// Theme is loaded dynamically in index.html and toggled in Topbar.jsx
import "primereact/resources/primereact.min.css"
import "primeicons/primeicons.css"
import App from './App.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <PrimeReactProvider>
      <App />
    </PrimeReactProvider>
  </StrictMode>,
)
