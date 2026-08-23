import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { GoogleOAuthProvider } from '@react-oauth/google'
import { QueryClientProvider } from '@tanstack/react-query'
import './index.css'
import App from './App.tsx'
import { queryClient } from './lib/query.ts'

const googleClientID = import.meta.env.VITE_GOOGLE_CLIENT_ID

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      {googleClientID ? <GoogleOAuthProvider clientId={googleClientID}><App /></GoogleOAuthProvider> : <App />}
    </QueryClientProvider>
  </StrictMode>,
)
