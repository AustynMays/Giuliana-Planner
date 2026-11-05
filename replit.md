# Senior Planner

A responsive, installable planner for schoolwork, events, due dates, and personal time.

## Run & Operate

- `pnpm --filter @workspace/mobile run dev` — run the Expo web preview
- `pnpm --filter @workspace/mobile run typecheck` — typecheck the app
- `pnpm --filter @workspace/mobile run build` — export the static PWA to `artifacts/mobile/dist`
- `pnpm --filter @workspace/mobile run serve` — preview the static export locally
- The planner is local-only; it does not use an API, account service, or database.
- The former API artifact has no configured workflow or production service.

## Stack

- pnpm workspaces, Expo, Expo Router, React Native Web, and TypeScript
- Planner records: browser `localStorage` with automatic persistence
- PWA: static web export, manifest, and service worker
- Appearance settings: device-local storage

## Where things live

- `artifacts/mobile/app/` — planner screens and navigation
- `artifacts/mobile/context/PlannerContext.tsx` — local planner data and backups
- `artifacts/mobile/constants/colors.ts` — existing theme tokens
- `artifacts/mobile/public/` — PWA manifest, service worker, and install icons

## Architecture decisions

- JSON backups are the user's cross-device transfer path; planner data does not sync.
- The API artifact is disabled; the mobile artifact's production output is static.

## Product

_Describe the high-level user-facing capabilities of this app once they exist._

## User preferences

_Populate as you build — explicit user instructions worth remembering across sessions._

## Gotchas

_Populate as you build — sharp edges, "always run X before Y" rules._

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
