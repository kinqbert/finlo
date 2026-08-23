# Finlo

Finlo is a personal-finance application with one Go REST API shared by a React web app and an Expo/React Native mobile app.

## Applications

- `server/` — Echo, GORM, PostgreSQL, JWT authentication, and financial data APIs.
- `apps/web/` — React and Vite. UI work should use Radix UI primitives.
- `apps/mobile/` — Expo and React Native.

The product is dashboard-first: balances, spending, budgets, savings, subscriptions, and proactive financial insights should be understandable without using a chat interface.

## Backend quick start

Create `server/.env` from `server/.env.example`, then start PostgreSQL and apply the migrations:

```bash
docker compose up -d --wait db
docker compose run --rm migrate
cd server
go run ./cmd/api
```

The API runs on `http://localhost:8080` by default. All `/api/*` routes require `Authorization: Bearer <access_token>`.

### Initial API

- `POST /auth/register`, `POST /auth/login`, `POST /auth/refresh`, `POST /auth/logout`, `GET /auth/me`
- `POST /auth/google` — verifies a Google ID token and returns Finlo access and refresh tokens
- `/api/accounts` — list, create, update, and delete accounts
- `/api/transactions` — list, create, and delete income/expense transactions
- `/api/budgets` — list, create/update, and delete monthly category budgets
- `/api/emergency-fund` — get and update the user's emergency-fund goal
- `/api/subscriptions` — list, create, update, and delete subscriptions
- `GET /api/dashboard` — balances, recent activity, budget progress, savings, subscriptions, and initial rule-based insights

Money is represented as integer minor units (`amount_minor`, `balance_minor`) plus a three-letter currency code. For example, `12345` UAH means `123.45 UAH`.

Set `GOOGLE_CLIENT_IDS` to the comma-separated web, iOS, and Android OAuth client IDs accepted by the backend (`GOOGLE_CLIENT_ID` remains a single-ID fallback). Web and mobile clients obtain a Google ID token and exchange it at `POST /auth/google`; Finlo never accepts an unverified Google profile from a client.

The web client keeps its short-lived access token in memory and asks the API to store the refresh token in an HttpOnly cookie. Native clients continue to receive and submit refresh tokens in JSON so they can use secure device storage. In production, set `AUTH_COOKIE_SECURE=true`; use `AUTH_COOKIE_SAME_SITE=none` only when the web app and API are genuinely cross-site, and then keep the API CORS allowlist explicit.

Monobank import and model-generated AI insights are planned behind the existing transaction `source`/`external_id` fields and dashboard insight response. The initial dashboard uses deterministic insights until an AI provider is configured.

## Frontend quick start

The web app uses Radix UI primitives and talks to the API through Vite's `localhost:8080` development proxy. Both React clients use Axios for transport, TanStack Query for server state, Zustand for global client-only state, and React Hook Form with Zod for forms:

```bash
cd apps/web
npm ci
npm run dev
```

Copy `apps/web/.env.example` to `.env` when using a deployed API or Google sign-in. Without an authenticated API, choose **Explore with demo data** to preview and interact with the complete interface.

The API contract lives in `server/openapi.yaml`. After changing a route or DTO, regenerate the checked-in web types with `npm run api:types` from `apps/web/`. Forms use React Hook Form and Zod for typed client validation. Optional production error reporting is enabled by setting `VITE_SENTRY_DSN` (and, when available, `VITE_APP_VERSION`).

The Expo app uses secure device storage for Finlo tokens and includes a dashboard, accounts/activity view, and quick transaction entry. The committed native identifiers are `com.kinqbert.finlo` for both platforms.

```bash
cd apps/mobile
npm ci

# First native installation (choose one)
npm run native:android
npm run native:ios

# Later TypeScript-only development
npm run start:dev-client
```

Local `.env` files are populated and git-ignored. The mobile file uses the development computer's current LAN address so a physical phone on the same network can reach the API. If the LAN address changes, update `EXPO_PUBLIC_API_URL` in `apps/mobile/.env`.

Standalone and store builds use the profiles in `apps/mobile/eas.json`:

```bash
cd apps/mobile
npx eas-cli@latest login
npx eas-cli@latest build:configure
npx eas-cli@latest build --platform android --profile preview
npx eas-cli@latest build --platform ios --profile preview
```

Configure the three public Google client IDs on mobile and add their values to the API's `GOOGLE_CLIENT_IDS` allowlist. See `apps/mobile/README.md` for local native builds, EAS environments, installable APKs, and store builds.
