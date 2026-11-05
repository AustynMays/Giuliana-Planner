# Senior Planner

Senior Planner is a responsive Expo web app and installable PWA for planning
schoolwork, events, assignments, tests, and personal time. It works offline
after the first successful load and does not require an account, API server, or
database.

## Where your data lives

- Tasks, events, and due dates are saved automatically in this browser's
  `localStorage`.
- On first load, the app asks the browser to keep its local storage persistent.
  The browser may decline, so this is a best-effort protection.
- Data belongs to this browser profile on this device. It does not sync to
  another browser or device.
- Clearing this site's data, switching browser profiles, or losing the device
  can remove planner data. Export a JSON backup regularly; the app reminds you
  when more than 7 days have passed since the last export.
- In Settings, import a JSON backup and choose to replace existing data or
  merge it. Merge skips records with IDs already present.
- Any data from an earlier account-based/server version must be exported from
  that version and imported here; it is not migrated automatically.

## Requirements

- Node.js 20 or newer
- pnpm 9 or newer

## Install and run

From the project root:

```sh
pnpm install
pnpm --filter @workspace/mobile run start
```

The development command starts Expo's web target. It does not require Expo Go.

## Build the static site

```sh
pnpm --filter @workspace/mobile run build
```

This exports the web app and PWA files to `artifacts/mobile/dist/`, including
the web manifest, service worker, and icons. To preview the exported files:

```sh
pnpm --filter @workspace/mobile run serve
```

The preview server serves only the static export and falls back to the app shell
for client-side routes.

## Deploy outside Replit

Publish the contents of `artifacts/mobile/dist/` to any static host that serves
HTTPS and supports SPA route fallback to `index.html`. Configure the host's
output directory as `artifacts/mobile/dist`; no Node API process, database, or
environment secrets are needed. If the host requires an explicit build command,
use:

```sh
pnpm install --frozen-lockfile
pnpm --filter @workspace/mobile run build
```

For Android installation, open the HTTPS site in Chrome and choose **Install
app** or **Add to Home screen**. The service worker caches the app shell and
static assets so the planner can reopen offline.

## Planner sections

- **Today:** date-specific schedule and task checklist.
- **Week:** events grouped by day and category.
- **Due:** assignments and tests ordered by due date.
- **Balance:** planned weekly time grouped by category.
- **Settings:** appearance controls and JSON backup import/export.
