# Finlo web

The Finlo web client is a React, Vite, Tailwind CSS, Radix UI, React Router, Axios, TanStack Query, Zustand, React Hook Form, and Zod application.

## Requirements

- Node.js 22.22 or newer
- The Finlo API running locally or available through `VITE_API_URL`

## Development

```bash
npm ci
npm run dev
```

Copy `.env.example` to `.env` to configure Google authentication or a deployed API. During local development, Vite proxies `/api`, `/auth`, and `/health` to `http://localhost:8080`.

## Source structure

```text
src/
├── api/         API client, authentication, and finance endpoints
├── assets/      Static assets imported by the application
├── components/  Reusable dialogs, finance widgets, layouts, and UI primitives
├── constants/   Routes, demo data, and static finance mappings
├── hooks/       Shared React hooks
├── lib/         Framework configuration and general helpers
├── pages/       Route-level screens
├── providers/   Application-wide provider composition
├── store/       Global client-only state managed by Zustand
├── App.tsx      Session handling and route composition
├── main.tsx     Browser entry point
└── types.ts     Shared API and UI types
```

Axios owns HTTP transport, authentication headers, and refresh retries. TanStack Query owns remote API state. Zustand owns the small amount of global client-only state, including demo sessions, while transient UI state remains local. React Hook Form and Zod own form state and validation.

## Routes

- `/` — overview
- `/accounts` — financial accounts and transactions
- `/goals` — savings goals and emergency-fund progress
- `/planning` — category budgets and recurring payments
- `/settings` — category management
- `/login` — authentication

Authenticated routes redirect guests to `/login` and return them to the originally requested route after authentication.

## Production deployment

The app uses browser-history routing. Configure the production host to serve `index.html` for unknown client-side paths such as `/planning` and `/settings`. API and static-asset paths should keep their normal handling and must not use the SPA fallback.

## Validation

```bash
npm run lint
npm run build
```
