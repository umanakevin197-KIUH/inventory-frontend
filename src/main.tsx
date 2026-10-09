import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { Toaster } from "react-hot-toast";

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
    <Toaster
    position="top-right"
    toastOptions={{
      style: {
        background: "#111113",
        color: "#fff",
        border: "1px solid rgba(255,255,255,0.1)",
      },
    }}
    />
  </StrictMode>,
)
