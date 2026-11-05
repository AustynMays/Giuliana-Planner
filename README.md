# Senior Planner

A native Expo planner for a high school senior. It includes email/password
accounts, synced events and tasks, assignment and test due dates, a weekly time
balance, and JSON backups.

The mobile app is Expo/React Native rather than the React/Vite PWA in the
original brief, as selected before implementation. It does not include PWA
installation or browser service-worker support.

## Requirements

- Node.js 20 or newer
- pnpm 9 or newer
- A PostgreSQL database that you manage
- Expo Go for a physical-device development preview

## Install and configure

From the project root:

```sh
pnpm install
cp .env.example .env
```

Edit `.env` and set a PostgreSQL connection string and a private session secret.
Set up the schema with:

```sh
pnpm --filter @workspace/api-server run db:setup
```

In production, set `NODE_ENV=production`, `SESSION_SECRET`, `DATABASE_URL`,
`CORS_ORIGIN`, and `PORT` in the hosting provider's environment settings. Use
HTTPS so the session cookie is secure. `CORS_ORIGIN` is the exact origin of the
app host; multiple origins can be comma-separated.

Outside Replit, the API reads `DATABASE_URL`. In Replit, it requires
`PLANNER_DATABASE_URL` and will not fall back to the Replit-managed database.

## Run locally

Start the API in one terminal:

```sh
pnpm --filter @workspace/api-server run dev
```

Start the Expo app in another terminal:

```sh
pnpm --filter @workspace/mobile run start
```

Set `EXPO_PUBLIC_API_URL` to the API origin (for example,
`http://localhost:3000`). For a physical phone, use an API host reachable on
your network and update `CORS_ORIGIN` to the app's origin. The API is mounted
under `/api`.

## Build and run the API

```sh
pnpm --filter @workspace/api-server run build
pnpm --filter @workspace/api-server run start
```

The API binds to `0.0.0.0` and uses `PORT`, defaulting to `3000`. The Expo
artifact has `start`, `build`, and `serve` scripts; `start` launches the normal
Expo development server and `build` creates the static web preview.

## Deploy outside Replit

Deploy the Express API as a Node.js service and attach a PostgreSQL database.
Configure `DATABASE_URL`, `SESSION_SECRET`, `NODE_ENV=production`, `CORS_ORIGIN`,
and `PORT`; run `schema.sql` once against that database. Build the Expo
application with the public `EXPO_PUBLIC_API_URL` set to the deployed API origin.
Expo's standard native build and submission process is separate from hosting the
API. The planner's production app and API use standard Expo, Express, and
PostgreSQL libraries. Replit's preview launcher is used only by the workspace
Expo development workflow; the separate `start` script is a regular Expo CLI
command.

## Data and security

- Passwords are hashed with bcrypt.
- Session IDs are stored in PostgreSQL and sent in HttpOnly cookies.
- Every planner query is scoped to the authenticated account.
- JSON import replaces the current account's planner data in one transaction.
- Backup files contain planner records only, not account credentials or sessions.

## Planner sections

- Today: a date-specific schedule and task checklist.
- Week: color-coded events by School, Clubs, Tutoring, Study, Social, and Personal.
- Due: assignments and tests ordered by nearest due date.
- Balance: weekly scheduled time grouped by category.
- Settings: appearance, JSON export/import, and sign out.
