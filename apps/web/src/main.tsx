import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { GoogleOAuthProvider } from '@react-oauth/google'
import './index.css'
import App from './App.tsx'

const googleClientID = import.meta.env.VITE_GOOGLE_CLIENT_ID

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    {googleClientID ? <GoogleOAuthProvider clientId={googleClientID}><App /></GoogleOAuthProvider> : <App />}
  </StrictMode>,
)
