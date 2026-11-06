# Senior Planner

A planner for a busy high school senior: school, clubs, tutoring, studying,
social time, and personal time. It runs as a website that can be installed on a
phone or laptop like an app, and it works offline.

## Where the data lives

Everything is saved **on the device, in the browser** (`localStorage`). There is
no account, no server, and no database.

- The phone and the laptop each have their own separate planner. They do not sync.
- Clearing the browser's site data, or uninstalling the app, erases the planner.
- Use **Settings → Export JSON backup** regularly. The app reminds you after 7 days.
- **Settings → Import JSON backup** restores a backup or moves data to another
  device (choose *Replace* or *Merge*).

## Sections

- **Today:** the day's schedule and to-do list.
- **Week:** events color-coded by School, Clubs, Tutoring, Study, Social, Personal.
- **Due:** assignments and tests, soonest first.
- **Balance:** how the week's time splits across categories.
- **Settings:** light/dark mode and backups.

## Run it on your own computer

You need [Node.js](https://nodejs.org) version 20 or newer (the LTS download is fine).

```sh
npm install        # one time, downloads the building blocks
npm start          # opens a live development version in the browser
```

To test the real, finished version (including offline mode and install):

```sh
npm run preview    # builds the site, then serves it at http://localhost:8081
```

Other commands:

| Command             | What it does                                     |
| ------------------- | ------------------------------------------------ |
| `npm run build`     | Builds the finished website into the `dist` folder |
| `npm run serve`     | Serves an existing `dist` folder locally         |
| `npm run typecheck` | Checks the code for type errors                  |

## Where it's published

The planner is published with **GitHub Pages**, at:

`https://<github-username>.github.io/<repo-name>/`

GitHub only sends the app's files to the device. The planner data never goes
to GitHub. It stays on each device.

Publishing is automatic. Every change merged into `main` runs
`.github/workflows/deploy.yml`, which builds the site and publishes it.
Installed copies pick up the new version and show an "Update available" message.

**One-time setup:** in the repo, go to **Settings → Pages**, and under
**Build and deployment → Source** choose **GitHub Actions**.
(On a free GitHub account, Pages requires the repo to be public.)

The site is plain files, so any other static host also works.
Use build command `npm run build` and output folder `dist`. If the host puts the
site in a sub-folder, set the `BASE_URL` environment variable to that folder
(for example `/my-planner`).

## Install it

**iPhone:** open the link in **Safari**, tap the **Share** button, then
**Add to Home Screen**. Always open the planner from the home-screen icon.
On iPhone, the home-screen app keeps its own saved data, separate from Safari.

**Laptop (Chrome or Edge):** open the link and click the **install icon** in the
address bar, or use the browser menu and choose **Install Senior Planner**.

**Android:** open the link in Chrome, tap **⋮**, then **Install app**.

After the first visit, the app opens without internet.

## Changing the look

All colors live in `constants/colors.ts` (light and dark versions), so the
theme can be changed in one file.

## Project layout

```
app/            screens (Today, Week, Due, Balance, Settings, add/edit form)
components/     shared building blocks
context/        planner data (saving/loading) and light/dark setting
constants/      colors and spacing (the theme)
public/         install files: manifest, service worker, icons
scripts/        build script that turns the app into an installable website
server/         tiny local preview server (only used on your computer)
```
