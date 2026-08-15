# Finlo repository guide

Finlo is a monorepo with three independently managed applications:

- `server/`: Go API using Echo, GORM, Goose migrations, and PostgreSQL.
- `apps/web/`: React and Vite web application.
- `apps/mobile/`: Expo and React Native application.

Run commands from the relevant application directory unless a command below
explicitly starts at the repository root.

## Dependency setup

```bash
(cd server && go mod download)
(cd apps/web && npm ci)
(cd apps/mobile && npm ci)
```

Do not run `./dev.sh` in a non-interactive or cloud environment. It requires
tmux and a graphical terminal emulator. Start and validate the individual
applications instead.

## Database

The development database uses these non-production defaults:

```text
DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=postgres
DB_NAME=finlo
DB_SSL_MODE=disable
```

For local development with Docker, start PostgreSQL and apply all migrations:

```bash
docker compose up -d --wait db
docker compose run --rm migrate
```

Check its state with `docker compose ps` and stop it with
`docker compose down`. Do not use `docker compose down --volumes` unless the
user explicitly asks to delete the local database data.

Codex Cloud runs inside a hosted container and should use the PostgreSQL
service installed by the environment setup script. In Cloud, ensure the
service is running with `sudo service postgresql start`, then apply migrations
from `server/` with `make migration-up`. Do not attempt to use Docker unless
`docker info` first confirms that a daemon is available.

Never connect tests or migrations to a production database. Do not run down,
redo, or destructive migrations unless the user explicitly requests them.

## Required environment variables

The API requires two distinct JWT secrets of at least 32 characters. Local and
cloud development must use disposable values, never production credentials.
The API also accepts `PORT`, `JWT_ISSUER`, and `JWT_AUDIENCE`; their defaults
are documented in `server/internal/platform/config/config.go`.

## Validation

For backend changes:

```bash
cd server
go test ./...
go vet ./...
```

For web changes:

```bash
cd apps/web
npm run lint
npm run build
```

For mobile changes:

```bash
cd apps/mobile
npm run lint
npx tsc --noEmit
```

Run every relevant group before reporting that work is complete. The web and
mobile packages currently have no unit-test script; do not invent `npm test`.

For backend runtime or integration checks, start the database and apply
migrations first. Use the health endpoint or focused API request appropriate to
the change, and stop any server process when verification finishes.

## Editing conventions

- Keep changes scoped to the requested application unless a shared change is
  necessary.
- Preserve the committed npm lockfiles and use `npm ci` for clean installs.
- Run `gofmt` on changed Go files.
- Add schema changes as new Goose migration files; do not rewrite migrations
  that may already have been applied.
- Treat `.env` files, tokens, passwords, and connection strings as sensitive.
  Do not print, commit, or copy them into logs or prompts.

