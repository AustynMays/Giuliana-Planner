# Zoe Planner

A phone-first planner web page for a busy high school senior: school, clubs,
tutoring, studying, social time, and personal time.

The whole planner is one file: **`Zoe-Planner.html`**. There is no app to
install, no build step, and no tools to download. To change the planner, edit
that one file.

## Sections

- **Today:** the day's schedule and to-do list.
- **Week:** events color-coded by School, Clubs, Tutoring, Study, Social, Personal.
- **Due:** assignments and tests, soonest first.
- **Balance:** how the week's time splits across categories.
- **Settings:** light/dark mode and backups.

## Where the data lives

Everything is saved **in the phone's browser** (`localStorage`). There is no
account, no server, and no database. Nothing is sent anywhere.

- Use the same browser each time (Safari on iPhone). Another browser, or
  Private Browsing, won't see the saved planner.
- Clearing the browser's website data erases the planner.
- Use **Settings → Export JSON backup** regularly. The planner reminds you after
  7 days. **Import JSON backup** brings a backup back in.

## The link

The page is shared with a plain GitHub Pages link. It's just the file being
shown in a browser, with no app and no install.

**One-time setup:** in this repo, go to **Settings → Pages**. Under
**Build and deployment → Source**, choose **Deploy from a branch**, pick
**main** and **/ (root)**, then click **Save**. After a minute or two the link
appears at the top of that page:

`https://<github-username>.github.io/<repo-name>/`

That link opens `Zoe-Planner.html` (through `index.html`). Any change merged
into `main` shows up at the same link within a few minutes.

**On iPhone:** open the link in Safari. To get back to it quickly, bookmark it,
or use **Share → Add to Home Screen** as a shortcut.

## Files

| File               | What it is                                     |
| ------------------ | ---------------------------------------------- |
| `Zoe-Planner.html` | The entire planner: layout, styles, and code    |
| `index.html`       | Sends the main link to `Zoe-Planner.html`       |
| `README.md`        | This guide                                     |

## Changing the look

All colors are CSS variables at the top of `Zoe-Planner.html`, under `:root`
(light mode) and `[data-theme="dark"]` (dark mode).
