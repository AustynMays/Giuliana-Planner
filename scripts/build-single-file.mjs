import { readFile, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const scriptDir = dirname(fileURLToPath(import.meta.url));
const projectDir = resolve(scriptDir, "..");
const iconPath = resolve(projectDir, "public", "icons", "icon-192.png");
const outputPath = resolve(projectDir, "Giuliana-Planner.html");

let iconDataUri = "";
try {
  const iconBuffer = await readFile(iconPath);
  iconDataUri = `data:image/png;base64,${iconBuffer.toString("base64")}`;
} catch {
  iconDataUri = "";
}

const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no, viewport-fit=cover" />
  <title>Senior Planner</title>
  <meta name="theme-color" content="#315a46" id="meta-theme-color" />
  <meta name="mobile-web-app-capable" content="yes" />
  <meta name="apple-mobile-web-app-capable" content="yes" />
  <meta name="apple-mobile-web-app-status-bar-style" content="default" />
  <meta name="apple-mobile-web-app-title" content="Planner" />
  ${iconDataUri ? `<link rel="icon" type="image/png" href="${iconDataUri}" />\n  <link rel="apple-touch-icon" href="${iconDataUri}" />` : ""}
  <style>
    :root {
      --bg: #f7f5ef;
      --fg: #1e3027;
      --card: #fffefa;
      --card-fg: #1e3027;
      --primary: #315a46;
      --primary-fg: #ffffff;
      --secondary: #e8eee6;
      --secondary-fg: #315a46;
      --muted: #eeede6;
      --muted-fg: #68756d;
      --accent: #f2d2bd;
      --accent-fg: #603e2f;
      --destructive: #b8403c;
      --destructive-fg: #ffffff;
      --border: #deded4;
      --cat-School: #315a46;
      --cat-Clubs: #8a6942;
      --cat-Tutoring: #517a83;
      --cat-Study: #84654f;
      --cat-Social: #bb674e;
      --cat-Personal: #7a7151;
      --shadow: 0 2px 10px rgba(30, 48, 39, 0.05);
    }

    [data-theme="dark"] {
      --bg: #151d18;
      --fg: #eef1e8;
      --card: #202b23;
      --card-fg: #eef1e8;
      --primary: #a8c9a7;
      --primary-fg: #18251c;
      --secondary: #2b3a30;
      --secondary-fg: #d9e8d5;
      --muted: #29332c;
      --muted-fg: #a3b2a5;
      --accent: #633f34;
      --accent-fg: #ffe1ce;
      --destructive: #eb827c;
      --destructive-fg: #291313;
      --border: #39463d;
      --cat-School: #a8c9a7;
      --cat-Clubs: #d7b17e;
      --cat-Tutoring: #91c4cb;
      --cat-Study: #d4a58c;
      --cat-Social: #f09a7c;
      --cat-Personal: #d3ca8e;
      --shadow: 0 2px 12px rgba(0, 0, 0, 0.25);
    }

    * {
      box-sizing: border-box;
      -webkit-tap-highlight-color: transparent;
    }

    html, body {
      margin: 0;
      padding: 0;
      background-color: var(--bg);
      color: var(--fg);
      font-family: "Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      font-size: 15px;
      line-height: 1.45;
      min-height: 100%;
      overscroll-behavior-y: none;
    }

    button, input, textarea, select {
      font-family: inherit;
      font-size: inherit;
      color: inherit;
    }

    button {
      cursor: pointer;
      border: none;
      background: none;
      padding: 0;
      transition: opacity 0.15s ease, transform 0.1s ease;
    }

    button:active {
      opacity: 0.72;
    }

    .app-container {
      max-width: 960px;
      margin: 0 auto;
      padding: calc(env(safe-area-inset-top, 0px) + 24px) 20px calc(env(safe-area-inset-bottom, 0px) + 124px);
      display: flex;
      flex-direction: column;
      gap: 20px;
    }

    .page-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      min-height: 74px;
      gap: 14px;
    }

    .eyebrow {
      font-size: 10px;
      letter-spacing: 1.6px;
      font-weight: 600;
      color: var(--muted-fg);
      text-transform: uppercase;
      margin-bottom: 4px;
    }

    .page-title {
      font-size: 31px;
      line-height: 38px;
      font-weight: 700;
      margin: 0;
      color: var(--fg);
    }

    .page-subtitle {
      font-size: 14px;
      line-height: 20px;
      color: var(--muted-fg);
      margin: 4px 0 0;
    }

    .icon-btn {
      width: 44px;
      height: 44px;
      border-radius: 12px;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      color: var(--fg);
      flex-shrink: 0;
    }

    .icon-btn:hover {
      background: var(--secondary);
    }

    .surface {
      background-color: var(--card);
      border: 1px solid var(--border);
      border-radius: 18px;
      padding: 16px;
      display: flex;
      flex-direction: column;
      gap: 12px;
      box-shadow: var(--shadow);
    }

    .section-block {
      display: flex;
      flex-direction: column;
      gap: 10px;
    }

    .section-heading {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-top: 4px;
    }

    .section-title {
      font-size: 17px;
      font-weight: 600;
      margin: 0;
    }

    .small-btn {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      min-height: 42px;
      padding: 0 15px;
      gap: 7px;
      border-radius: 999px;
      background-color: var(--primary);
      color: var(--primary-fg);
      font-size: 13px;
      font-weight: 600;
    }

    .small-btn.secondary {
      background-color: var(--secondary);
      color: var(--secondary-fg);
    }

    .category-chip {
      display: inline-flex;
      align-items: center;
      align-self: flex-start;
      gap: 6px;
      padding: 5px 10px;
      border-radius: 999px;
      background-color: var(--secondary);
      color: var(--secondary-fg);
      font-size: 11px;
      font-weight: 500;
    }

    .category-dot {
      width: 7px;
      height: 7px;
      border-radius: 50%;
      flex-shrink: 0;
    }

    .empty-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 28px 24px;
      gap: 9px;
      text-align: center;
    }

    .empty-icon {
      width: 52px;
      height: 52px;
      border-radius: 26px;
      background-color: var(--secondary);
      color: var(--primary);
      display: flex;
      align-items: center;
      justify-content: center;
      margin-bottom: 4px;
    }

    .empty-title {
      font-size: 16px;
      font-weight: 600;
      margin: 0;
    }

    .empty-desc {
      font-size: 13px;
      line-height: 19px;
      color: var(--muted-fg);
      margin: 0 0 4px;
      max-width: 360px;
    }

    /* Date bar & Today */
    .date-bar {
      display: flex;
      align-items: center;
      justify-content: space-between;
    }

    .date-label {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 2px;
    }

    .date-number {
      font-size: 18px;
      font-weight: 600;
    }

    .add-row {
      display: flex;
      gap: 9px;
      flex-wrap: wrap;
    }

    .banner-btn {
      min-height: 48px;
      padding: 10px 14px;
      border-radius: 18px;
      background-color: var(--secondary);
      color: var(--secondary-fg);
      display: flex;
      align-items: center;
      gap: 10px;
      font-size: 12px;
      font-weight: 500;
      text-align: left;
      width: 100%;
    }

    /* Event & Task lists */
    .list-stack {
      display: flex;
      flex-direction: column;
      gap: 9px;
    }

    .event-card {
      background-color: var(--card);
      border: 1px solid var(--border);
      border-radius: 18px;
      padding: 13px;
      display: flex;
      align-items: stretch;
      gap: 12px;
      text-align: left;
      width: 100%;
      box-shadow: var(--shadow);
    }

    .event-line {
      width: 3.5px;
      border-radius: 4px;
      flex-shrink: 0;
    }

    .event-content {
      flex: 1;
      display: flex;
      flex-direction: column;
      gap: 6px;
      align-items: flex-start;
      min-width: 0;
    }

    .event-time {
      font-size: 12px;
      font-weight: 600;
      color: var(--primary);
    }

    .event-title {
      font-size: 15px;
      font-weight: 600;
      color: var(--fg);
      word-break: break-word;
    }

    .task-list-surface {
      padding: 0 14px;
      gap: 0;
    }

    .task-row {
      min-height: 72px;
      display: flex;
      align-items: center;
      gap: 11px;
      border-bottom: 1px solid var(--border);
    }

    .task-row:last-child {
      border-bottom: none;
    }

    .checkbox-btn {
      width: 24px;
      height: 24px;
      border-radius: 8px;
      border: 1.5px solid var(--border);
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
      color: var(--primary-fg);
    }

    .checkbox-btn.checked {
      background-color: var(--primary);
      border-color: var(--primary);
    }

    .task-text-wrap {
      flex: 1;
      display: flex;
      flex-direction: column;
      gap: 7px;
      padding: 12px 0;
      text-align: left;
      min-width: 0;
    }

    .task-title {
      font-size: 14px;
      line-height: 19px;
      font-weight: 500;
      color: var(--fg);
      word-break: break-word;
    }

    .task-title.completed {
      color: var(--muted-fg);
      font-weight: 400;
      text-decoration: line-through;
    }

    .task-meta {
      display: flex;
      align-items: center;
      gap: 8px;
      flex-wrap: wrap;
    }

    /* Week strip */
    .day-strip {
      display: grid;
      grid-template-columns: repeat(7, 1fr);
      gap: 4px;
    }

    .day-btn {
      min-height: 64px;
      border-radius: 16px;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 4px;
      padding: 6px 2px;
    }

    .day-btn.selected {
      background-color: var(--primary);
      color: var(--primary-fg);
    }

    .today-dot {
      width: 4px;
      height: 4px;
      border-radius: 50%;
    }

    .day-group-label {
      font-size: 12px;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      color: var(--muted-fg);
      margin: 4px 0 2px;
    }

    /* Due summary & Balance */
    .summary-row {
      display: flex;
      flex-direction: row;
      align-items: center;
      gap: 12px;
    }

    .summary-icon {
      width: 44px;
      height: 44px;
      border-radius: 15px;
      background-color: var(--secondary);
      color: var(--primary);
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }

    .progress-track {
      height: 7px;
      background-color: var(--muted);
      border-radius: 999px;
      overflow: hidden;
    }

    .progress-fill {
      height: 100%;
      border-radius: 999px;
      transition: width 0.25s ease;
    }

    /* Bottom Tab Bar */
    .tab-bar-wrap {
      position: fixed;
      left: 0;
      right: 0;
      bottom: 0;
      z-index: 100;
      display: flex;
      justify-content: center;
      padding: 0 16px calc(env(safe-area-inset-bottom, 0px) + 12px);
      pointer-events: none;
    }

    .tab-bar {
      pointer-events: auto;
      width: 100%;
      max-width: 820px;
      height: 68px;
      background-color: var(--card);
      border: 1px solid var(--border);
      border-radius: 24px;
      display: grid;
      grid-template-columns: repeat(5, 1fr);
      padding: 6px;
      box-shadow: 0 6px 24px rgba(0, 0, 0, 0.1);
    }

    @media (max-width: 640px) {
      .tab-bar-wrap {
        padding: 0;
      }
      .tab-bar {
        border-radius: 0;
        border-left: none;
        border-right: none;
        border-bottom: none;
        height: calc(66px + env(safe-area-inset-bottom, 0px));
        padding-bottom: calc(6px + env(safe-area-inset-bottom, 0px));
      }
    }

    .tab-btn {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 3px;
      border-radius: 16px;
      color: var(--muted-fg);
      font-size: 10px;
      font-weight: 500;
    }

    .tab-btn.active {
      color: var(--primary);
      font-weight: 600;
    }

    /* Modal */
    .modal-backdrop {
      position: fixed;
      inset: 0;
      z-index: 200;
      background: rgba(0, 0, 0, 0.45);
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 16px;
      overflow-y: auto;
    }

    .modal-sheet {
      background-color: var(--bg);
      border: 1px solid var(--border);
      border-radius: 26px;
      width: 100%;
      max-width: 560px;
      max-height: 92vh;
      overflow-y: auto;
      padding: 20px;
      display: flex;
      flex-direction: column;
      gap: 16px;
      box-shadow: 0 16px 48px rgba(0, 0, 0, 0.28);
    }

    .field {
      display: flex;
      flex-direction: column;
      gap: 7px;
    }

    .field-label {
      font-size: 13px;
      font-weight: 600;
      color: var(--fg);
    }

    .text-input {
      min-height: 48px;
      border: 1px solid var(--border);
      background-color: var(--card);
      color: var(--fg);
      border-radius: 16px;
      padding: 10px 13px;
      font-size: 14px;
      width: 100%;
      outline: none;
    }

    .text-input:focus {
      border-color: var(--primary);
    }

    textarea.text-input {
      min-height: 96px;
      resize: vertical;
    }

    .pill-group {
      display: flex;
      flex-wrap: wrap;
      gap: 7px;
    }

    .pill-option {
      min-height: 36px;
      padding: 0 13px;
      border-radius: 999px;
      border: 1px solid var(--border);
      background-color: var(--card);
      color: var(--fg);
      font-size: 12px;
      font-weight: 500;
      display: inline-flex;
      align-items: center;
      justify-content: center;
    }

    .pill-option.active {
      background-color: var(--secondary);
      border-color: var(--primary);
      color: var(--secondary-fg);
      font-weight: 600;
    }

    .two-col {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 10px;
    }

    .primary-block-btn {
      min-height: 50px;
      border-radius: 18px;
      background-color: var(--primary);
      color: var(--primary-fg);
      font-weight: 600;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      width: 100%;
    }

    .secondary-block-btn {
      min-height: 50px;
      border-radius: 18px;
      background-color: var(--secondary);
      color: var(--secondary-fg);
      font-weight: 600;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      width: 100%;
    }

    .outline-block-btn {
      min-height: 50px;
      border-radius: 18px;
      background-color: var(--card);
      border: 1px solid var(--border);
      color: var(--fg);
      font-weight: 600;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      width: 100%;
    }

    .mode-row {
      min-height: 52px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      width: 100%;
      text-align: left;
      border-top: 1px solid var(--border);
      font-weight: 500;
    }

    .mode-row:first-child {
      border-top: none;
    }

    .guide-step {
      display: flex;
      align-items: flex-start;
      gap: 10px;
      font-size: 13px;
      line-height: 19px;
      color: var(--fg);
    }

    .guide-badge {
      width: 22px;
      height: 22px;
      border-radius: 50%;
      background-color: var(--secondary);
      color: var(--primary);
      font-size: 12px;
      font-weight: 700;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
      margin-top: 1px;
    }

    .unsaved-pill {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 6px 12px;
      border-radius: 999px;
      font-size: 12px;
      font-weight: 600;
      background-color: var(--secondary);
      color: var(--primary);
    }
  </style>
</head>
<body>
  <!-- Embedded Planner State: When you click "Save Updated Planner File", your data is also saved directly inside this HTML file so you can move or open it anywhere! -->
  <script id="planner-embedded-state" type="application/json">null</script>

  <div id="app" class="app-container"></div>

  <div class="tab-bar-wrap">
    <nav class="tab-bar" aria-label="Main sections" id="tab-bar"></nav>
  </div>

  <div id="modal-root"></div>

  <script>
    (function () {
      var STORAGE_KEY = "senior-planner-data-v1";
      var MODE_KEY = "senior-planner-theme";
      var BACKUP_INTERVAL = 7 * 24 * 60 * 60 * 1000;
      var CATEGORIES = ["School", "Clubs", "Tutoring", "Study", "Social", "Personal"];

      var ICONS = {
        "sun": '<circle cx="12" cy="12" r="5"></circle><line x1="12" y1="1" x2="12" y2="3"></line><line x1="12" y1="21" x2="12" y2="23"></line><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line><line x1="1" y1="12" x2="3" y2="12"></line><line x1="21" y1="12" x2="23" y2="12"></line><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line>',
        "sunrise": '<path d="M17 18a5 5 0 0 0-10 0"></path><line x1="12" y1="2" x2="12" y2="9"></line><line x1="4.22" y1="10.22" x2="5.64" y2="11.64"></line><line x1="1" y1="18" x2="3" y2="18"></line><line x1="21" y1="18" x2="23" y2="18"></line><line x1="18.36" y1="11.64" x2="19.78" y2="10.22"></line><line x1="23" y1="22" x2="1" y2="22"></line><polyline points="8 6 12 2 16 6"></polyline>',
        "calendar": '<rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line>',
        "bookmark": '<path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"></path>',
        "bar-chart-2": '<line x1="18" y1="20" x2="18" y2="10"></line><line x1="12" y1="20" x2="12" y2="4"></line><line x1="6" y1="20" x2="6" y2="14"></line>',
        "settings": '<circle cx="12" cy="12" r="3"></circle><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path>',
        "chevron-left": '<polyline points="15 18 9 12 15 6"></polyline>',
        "chevron-right": '<polyline points="9 18 15 12 9 6"></polyline>',
        "plus": '<line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line>',
        "check-square": '<polyline points="9 11 12 14 22 4"></polyline><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"></path>',
        "check": '<polyline points="20 6 9 17 4 12"></polyline>',
        "edit-2": '<path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"></path>',
        "book-open": '<path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"></path><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"></path>',
        "clock": '<circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline>',
        "pie-chart": '<path d="M21.21 15.89A10 10 0 1 1 8 2.83"></path><path d="M22 12A10 10 0 0 0 12 2v10z"></path>',
        "hard-drive": '<line x1="22" y1="12" x2="2" y2="12"></line><path d="M5.45 5.11L2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z"></path><line x1="6" y1="16" x2="6.01" y2="16"></line><line x1="10" y1="16" x2="10.01" y2="16"></line>',
        "download": '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line>',
        "download-cloud": '<polyline points="8 17 12 21 16 17"></polyline><line x1="12" y1="12" x2="12" y2="21"></line><path d="M20.88 18.09A5 5 0 0 0 18 9h-1.26A8 8 0 1 0 3 16.29"></path>',
        "upload": '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="17 8 12 3 7 8"></polyline><line x1="12" y1="3" x2="12" y2="15"></line>',
        "check-circle": '<path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline>',
        "circle": '<circle cx="12" cy="12" r="10"></circle>',
        "alert-circle": '<circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line>',
        "alert-triangle": '<path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line>',
        "x": '<line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line>',
        "trash-2": '<polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line>',
        "smartphone": '<rect x="5" y="2" width="14" height="20" rx="2" ry="2"></rect><line x1="12" y1="18" x2="12.01" y2="18"></line>',
        "save": '<path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"></path><polyline points="17 21 17 13 7 13 7 21"></polyline><polyline points="7 3 7 8 15 8"></polyline>'
      };

      function iconSvg(name, size, strokeColor) {
        var s = size || 18;
        var stroke = strokeColor || "currentColor";
        var paths = ICONS[name] || ICONS["circle"];
        return '<svg width="' + s + '" height="' + s + '" viewBox="0 0 24 24" fill="none" stroke="' + stroke + '" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + paths + '</svg>';
      }

      function escapeHtml(str) {
        return String(str == null ? "" : str)
          .replace(/&/g, "&amp;")
          .replace(/</g, "&lt;")
          .replace(/>/g, "&gt;")
          .replace(/"/g, "&quot;")
          .replace(/'/g, "&#39;");
      }

      function createId() {
        if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
          return crypto.randomUUID();
        }
        return Date.now().toString(36) + "-" + Math.random().toString(36).slice(2, 12);
      }

      function dateToInput(d) {
        var year = d.getFullYear();
        var month = String(d.getMonth() + 1).padStart(2, "0");
        var day = String(d.getDate()).padStart(2, "0");
        return year + "-" + month + "-" + day;
      }

      function mondayOf(d) {
        var offset = (d.getDay() + 6) % 7;
        return new Date(d.getFullYear(), d.getMonth(), d.getDate() - offset);
      }

      function formatClock(isoOrTime) {
        if (!isoOrTime) return "";
        if (/^\\d{2}:\\d{2}$/.test(isoOrTime)) {
          var parts = isoOrTime.split(":");
          var dt = new Date(2000, 0, 1, Number(parts[0]), Number(parts[1]));
          return dt.toLocaleTimeString([], { hour: "numeric", minute: "2-digit", hour12: true });
        }
        var d = new Date(isoOrTime);
        if (isNaN(d.getTime())) return isoOrTime;
        return d.toLocaleTimeString([], { hour: "numeric", minute: "2-digit", hour12: true });
      }

      function formatLongDate(d) {
        return d.toLocaleDateString([], { weekday: "long", month: "long", day: "numeric" });
      }

      function dueLabel(iso) {
        var date = new Date(iso);
        var day = new Date(date.getFullYear(), date.getMonth(), date.getDate());
        var today = new Date();
        today.setHours(0, 0, 0, 0);
        var diff = Math.round((day.getTime() - today.getTime()) / 86400000);
        if (diff < 0) return "Overdue by " + Math.abs(diff) + " day" + (Math.abs(diff) === 1 ? "" : "s");
        if (diff === 0) return "Due today";
        if (diff === 1) return "Due tomorrow";
        return "Due " + date.toLocaleDateString([], { weekday: "short", month: "short", day: "numeric" });
      }

      function durationLabel(minutes) {
        return Math.floor(minutes / 60) + "h " + (minutes % 60) + "m";
      }

      function getEmbeddedState() {
        try {
          var el = document.getElementById("planner-embedded-state");
          if (!el || !el.textContent) return null;
          var parsed = JSON.parse(el.textContent);
          if (parsed && parsed.formatVersion === 1 && Array.isArray(parsed.tasks)) {
            return parsed;
          }
        } catch (e) {}
        return null;
      }

      function emptyPlannerState() {
        return {
          formatVersion: 1,
          createdAt: new Date().toISOString(),
          lastExportAt: null,
          tasks: [],
          events: [],
          deadlines: []
        };
      }

      var storageError = null;

      function loadState() {
        var embedded = getEmbeddedState();
        try {
          var raw = window.localStorage.getItem(STORAGE_KEY);
          if (raw) {
            var parsed = JSON.parse(raw);
            if (parsed && parsed.formatVersion === 1 && Array.isArray(parsed.tasks)) {
              // If the HTML file itself has embedded items and localStorage is empty, prefer embedded
              var localCount = (parsed.tasks.length || 0) + (parsed.events.length || 0) + (parsed.deadlines.length || 0);
              var embeddedCount = embedded ? (embedded.tasks.length || 0) + (embedded.events.length || 0) + (embedded.deadlines.length || 0) : 0;
              if (localCount === 0 && embeddedCount > 0) {
                window.localStorage.setItem(STORAGE_KEY, JSON.stringify(embedded));
                return embedded;
              }
              return parsed;
            }
          }
          if (embedded) {
            window.localStorage.setItem(STORAGE_KEY, JSON.stringify(embedded));
            return embedded;
          }
          var initial = emptyPlannerState();
          window.localStorage.setItem(STORAGE_KEY, JSON.stringify(initial));
          return initial;
        } catch (err) {
          storageError = "Browser automatic storage is restricted here (for example in an iPhone file preview). Use 'Save Planner File' in Settings to keep your changes inside the file.";
          return embedded || emptyPlannerState();
        }
      }

      var plannerState = loadState();
      var themeMode = "system";
      try {
        var savedTheme = window.localStorage.getItem(MODE_KEY);
        if (savedTheme === "light" || savedTheme === "dark" || savedTheme === "system") {
          themeMode = savedTheme;
        }
      } catch (e) {}

      function applyTheme() {
        var isDark = themeMode === "dark" || (themeMode === "system" && window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches);
        document.documentElement.setAttribute("data-theme", isDark ? "dark" : "light");
        var meta = document.getElementById("meta-theme-color");
        if (meta) meta.setAttribute("content", isDark ? "#151d18" : "#315a46");
      }

      if (window.matchMedia) {
        try {
          window.matchMedia("(prefers-color-scheme: dark)").addEventListener("change", applyTheme);
        } catch (e) {}
      }
      applyTheme();

      function saveState() {
        // Always keep embedded script tag in DOM up to date too
        var el = document.getElementById("planner-embedded-state");
        if (el) {
          el.textContent = JSON.stringify(plannerState);
        }
        try {
          window.localStorage.setItem(STORAGE_KEY, JSON.stringify(plannerState));
          storageError = null;
        } catch (err) {
          storageError = "Automatic browser storage is unavailable. Tap 'Save Updated Planner File' in Settings so your changes stay saved.";
        }
      }

      // Navigation & UI state
      var currentTab = "today"; // today | week | due | balance | settings
      var selectedDate = new Date();
      var weekFocusDate = new Date();
      var balanceFocusDate = new Date();
      var settingsMessage = "";
      var pendingBackup = null; // { backup, fileName }
      var activeModal = null; // null or form state object

      function isBackupDue() {
        var last = plannerState.lastExportAt || plannerState.createdAt;
        if (!last) return false;
        return Date.now() - new Date(last).getTime() > BACKUP_INTERVAL;
      }

      function saveSelfContainedHtmlFile() {
        var el = document.getElementById("planner-embedded-state");
        if (el) {
          el.textContent = JSON.stringify(plannerState);
        }
        plannerState.lastExportAt = new Date().toISOString();
        saveState();

        var doctype = "<!DOCTYPE html>\\n";
        var fullHtml = doctype + document.documentElement.outerHTML;
        var blob = new Blob([fullHtml], { type: "text/html;charset=utf-8" });
        var url = URL.createObjectURL(blob);
        var a = document.createElement("a");
        a.href = url;
        a.download = "Giuliana-Planner.html";
        a.click();
        setTimeout(function () { URL.revokeObjectURL(url); }, 1000);
        settingsMessage = "Saved a fresh Giuliana-Planner.html file with all your current tasks, events, and due dates built right in!";
        render();
      }

      function exportJsonBackup() {
        try {
          var backup = {
            formatVersion: 1,
            exportedAt: new Date().toISOString(),
            tasks: plannerState.tasks,
            events: plannerState.events,
            deadlines: plannerState.deadlines
          };
          var blob = new Blob([JSON.stringify(backup, null, 2)], { type: "application/json" });
          var url = URL.createObjectURL(blob);
          var a = document.createElement("a");
          a.href = url;
          a.download = "senior-planner-" + new Date().toISOString().slice(0, 10) + ".json";
          a.click();
          setTimeout(function () { URL.revokeObjectURL(url); }, 1000);
          plannerState.lastExportAt = new Date().toISOString();
          saveState();
          settingsMessage = "Backup saved. Keep the JSON file somewhere safe.";
          render();
        } catch (e) {
          settingsMessage = "The backup could not be exported.";
          render();
        }
      }

      function chooseJsonBackup() {
        settingsMessage = "";
        var picker = document.createElement("input");
        picker.type = "file";
        picker.accept = ".json,application/json,.html,text/html";
        picker.onchange = function () {
          var file = picker.files && picker.files[0];
          if (!file) return;
          var reader = new FileReader();
          reader.onload = function () {
            try {
              var text = String(reader.result || "");
              var parsed = null;
              if (file.name.toLowerCase().endsWith(".html")) {
                var match = text.match(/<script[^>]*id=["']planner-embedded-state["'][^>]*>([\\s\\S]*?)<\\/script>/i);
                if (match && match[1]) {
                  parsed = JSON.parse(match[1]);
                }
              } else {
                parsed = JSON.parse(text);
              }
              if (
                !parsed ||
                parsed.formatVersion !== 1 ||
                !Array.isArray(parsed.tasks) ||
                !Array.isArray(parsed.events) ||
                !Array.isArray(parsed.deadlines)
              ) {
                settingsMessage = "That file is not a supported Senior Planner backup.";
                render();
                return;
              }
              pendingBackup = { backup: parsed, fileName: file.name };
              render();
            } catch (e) {
              settingsMessage = "The selected file could not be read as a planner backup.";
              render();
            }
          };
          reader.readAsText(file);
        };
        picker.click();
      }

      function mergeById(current, incoming) {
        var merged = current.slice();
        var ids = {};
        for (var i = 0; i < current.length; i++) ids[current[i].id] = true;
        for (var j = 0; j < incoming.length; j++) {
          if (!ids[incoming[j].id]) {
            merged.push(incoming[j]);
            ids[incoming[j].id] = true;
          }
        }
        return merged;
      }

      function applyImport(mode) {
        if (!pendingBackup) return;
        var b = pendingBackup.backup;
        var count = b.tasks.length + b.events.length + b.deadlines.length;
        if (mode === "replace") {
          plannerState.tasks = b.tasks;
          plannerState.events = b.events;
          plannerState.deadlines = b.deadlines;
        } else {
          plannerState.tasks = mergeById(plannerState.tasks, b.tasks);
          plannerState.events = mergeById(plannerState.events, b.events);
          plannerState.deadlines = mergeById(plannerState.deadlines, b.deadlines);
        }
        var name = pendingBackup.fileName;
        pendingBackup = null;
        saveState();
        settingsMessage = mode === "replace"
          ? "Replaced planner data with " + count + " items from " + name + "."
          : "Merged " + count + " items from " + name + ". Items with matching IDs were skipped.";
        render();
      }

      function openItemModal(config) {
        var defDate = dateToInput(selectedDate);
        activeModal = {
          kind: config.kind || "task",
          id: config.id || "",
          title: config.title || "",
          date: config.date || defDate,
          time: config.time !== undefined ? config.time : "15:00",
          endTime: config.endTime || "16:00",
          category: CATEGORIES.indexOf(config.category) !== -1 ? config.category : "School",
          notes: config.notes || "",
          deadlineKind: config.deadlineKind === "test" ? "test" : "assignment",
          completed: Boolean(config.completed),
          error: ""
        };
        renderModal();
      }

      function renderCategoryChip(category) {
        var colorVar = "var(--cat-" + category + ", var(--primary))";
        return '<span class="category-chip"><span class="category-dot" style="background:' + colorVar + '"></span>' + escapeHtml(category) + '</span>';
      }

      function renderToday() {
        var dateKey = dateToInput(selectedDate);
        var tasks = plannerState.tasks
          .filter(function (t) { return t.date === dateKey; })
          .sort(function (a, b) {
            return Number(a.completed) - Number(b.completed) || (a.time || "").localeCompare(b.time || "");
          });
        var events = plannerState.events
          .filter(function (e) { return dateToInput(new Date(e.startsAt)) === dateKey; })
          .sort(function (a, b) { return a.startsAt.localeCompare(b.startsAt); });
        var completed = tasks.filter(function (t) { return t.completed; }).length;

        var html = '';
        html += '<header class="page-header">';
        html += '  <div>';
        html += '    <div class="eyebrow">YOUR PLANNER</div>';
        html += '    <h1 class="page-title">Today</h1>';
        html += '    <p class="page-subtitle">' + escapeHtml(formatLongDate(selectedDate)) + '</p>';
        html += '  </div>';
        html += '  <button class="icon-btn" data-action="go-tab" data-tab="settings" aria-label="Open settings">' + iconSvg("settings", 21) + '</button>';
        html += '</header>';

        if (isBackupDue()) {
          html += '<button class="banner-btn" data-action="go-tab" data-tab="settings">';
          html += '  <span style="color:var(--primary);display:flex">' + iconSvg("download-cloud", 17) + '</span>';
          html += '  <span style="flex:1">It’s been over a week since your last backup.</span>';
          html += '  <span style="color:var(--primary);display:flex">' + iconSvg("chevron-right", 17) + '</span>';
          html += '</button>';
        }

        if (storageError) {
          html += '<div class="surface" style="flex-direction:row;align-items:center;gap:10px">';
          html += '  <span style="color:var(--destructive);display:flex">' + iconSvg("alert-circle", 18) + '</span>';
          html += '  <span style="font-size:12px;line-height:18px;flex:1">' + escapeHtml(storageError) + '</span>';
          html += '</div>';
        }

        html += '<div class="surface" style="gap:14px">';
        html += '  <div class="date-bar">';
        html += '    <button class="icon-btn" data-action="move-day" data-delta="-1" aria-label="Previous day">' + iconSvg("chevron-left", 20) + '</button>';
        html += '    <div class="date-label">';
        html += '      <div class="date-number">' + escapeHtml(selectedDate.toLocaleDateString([], { month: "short", day: "numeric" })) + '</div>';
        html += '      <div style="color:var(--muted-fg);font-size:13px">' + completed + ' of ' + tasks.length + ' tasks done</div>';
        html += '    </div>';
        html += '    <button class="icon-btn" data-action="move-day" data-delta="1" aria-label="Next day">' + iconSvg("chevron-right", 20) + '</button>';
        html += '  </div>';
        html += '  <div class="add-row">';
        html += '    <button class="small-btn" data-action="add-task" data-date="' + dateKey + '">' + iconSvg("check-square", 15) + '<span>Add task</span></button>';
        html += '    <button class="small-btn secondary" data-action="add-event" data-date="' + dateKey + '">' + iconSvg("plus", 15) + '<span>Add event</span></button>';
        html += '  </div>';
        html += '</div>';

        // Schedule section
        html += '<section class="section-block">';
        html += '  <div class="section-heading">';
        html += '    <h2 class="section-title">Schedule</h2>';
        html += '    <span style="color:var(--muted-fg);font-size:12px">' + events.length + ' planned</span>';
        html += '  </div>';
        if (events.length === 0) {
          html += '  <div class="surface"><div class="empty-state">';
          html += '    <div class="empty-icon">' + iconSvg("calendar", 22) + '</div>';
          html += '    <h3 class="empty-title">A little open space</h3>';
          html += '    <p class="empty-desc">Add an event when something needs a place in your day.</p>';
          html += '    <button class="small-btn" data-action="add-event" data-date="' + dateKey + '">' + iconSvg("plus", 15) + '<span>Add event</span></button>';
          html += '  </div></div>';
        } else {
          html += '  <div class="list-stack">';
          for (var i = 0; i < events.length; i++) {
            var ev = events[i];
            var catColor = "var(--cat-" + ev.category + ", var(--primary))";
            html += '    <button class="event-card" data-action="edit-event" data-id="' + escapeHtml(ev.id) + '">';
            html += '      <div class="event-line" style="background:' + catColor + '"></div>';
            html += '      <div class="event-content">';
            html += '        <div class="event-time">' + escapeHtml(formatClock(ev.startsAt)) + ' – ' + escapeHtml(formatClock(ev.endsAt)) + '</div>';
            html += '        <div class="event-title">' + escapeHtml(ev.title) + '</div>';
            html +=          renderCategoryChip(ev.category);
            if (ev.notes) {
              html += '      <div style="color:var(--muted-fg);font-size:12px">' + escapeHtml(ev.notes) + '</div>';
            }
            html += '      </div>';
            html += '      <span style="color:var(--muted-fg);align-self:center">' + iconSvg("chevron-right", 18) + '</span>';
            html += '    </button>';
          }
          html += '  </div>';
        }
        html += '</section>';

        // To-do section
        html += '<section class="section-block">';
        html += '  <div class="section-heading">';
        html += '    <h2 class="section-title">To-do</h2>';
        if (tasks.length > 0) {
          html += '  <span style="color:var(--muted-fg);font-size:12px">' + (tasks.length - completed) + ' left</span>';
        }
        html += '  </div>';
        if (tasks.length === 0) {
          html += '  <div class="surface"><div class="empty-state">';
          html += '    <div class="empty-icon">' + iconSvg("check-square", 22) + '</div>';
          html += '    <h3 class="empty-title">Nothing on the list</h3>';
          html += '    <p class="empty-desc">Capture a task here so it doesn’t have to stay in your head.</p>';
          html += '    <button class="small-btn" data-action="add-task" data-date="' + dateKey + '">' + iconSvg("plus", 15) + '<span>Add task</span></button>';
          html += '  </div></div>';
        } else {
          html += '  <div class="surface task-list-surface">';
          for (var j = 0; j < tasks.length; j++) {
            var task = tasks[j];
            html += '    <div class="task-row">';
            html += '      <button class="checkbox-btn ' + (task.completed ? "checked" : "") + '" data-action="toggle-task" data-id="' + escapeHtml(task.id) + '" aria-label="Toggle task">';
            if (task.completed) html += iconSvg("check", 14);
            html += '      </button>';
            html += '      <button class="task-text-wrap" data-action="edit-task" data-id="' + escapeHtml(task.id) + '">';
            html += '        <div class="task-title ' + (task.completed ? "completed" : "") + '">' + escapeHtml(task.title) + '</div>';
            html += '        <div class="task-meta">';
            if (task.time) {
              html += '          <span style="color:var(--muted-fg);font-size:11px">' + escapeHtml(formatClock(task.time)) + '</span>';
            }
            html +=              renderCategoryChip(task.category);
            html += '        </div>';
            html += '      </button>';
            html += '      <button class="icon-btn" data-action="edit-task" data-id="' + escapeHtml(task.id) + '" aria-label="Edit task" style="color:var(--muted-fg)">' + iconSvg("edit-2", 15) + '</button>';
            html += '    </div>';
          }
          html += '  </div>';
        }
        html += '</section>';

        return html;
      }

      function renderWeek() {
        var weekStart = mondayOf(weekFocusDate);
        var weekEnd = new Date(weekStart);
        weekEnd.setDate(weekEnd.getDate() + 7);
        var todayKey = dateToInput(new Date());
        var focusKey = dateToInput(weekFocusDate);

        var days = [];
        for (var i = 0; i < 7; i++) {
          var d = new Date(weekStart);
          d.setDate(d.getDate() + i);
          var key = dateToInput(d);
          var dayEvents = plannerState.events
            .filter(function (ev) { return dateToInput(new Date(ev.startsAt)) === key; })
            .sort(function (a, b) { return a.startsAt.localeCompare(b.startsAt); });
          days.push({ date: d, dayKey: key, events: dayEvents });
        }

        var label = weekStart.toLocaleDateString([], { month: "short", day: "numeric" }) + " – " +
          new Date(weekEnd.getTime() - 1).toLocaleDateString([], { month: "short", day: "numeric" });

        var html = '';
        html += '<header class="page-header"><div>';
        html += '  <div class="eyebrow">YOUR PLANNER</div>';
        html += '  <h1 class="page-title">This week</h1>';
        html += '  <p class="page-subtitle">A clear view of what’s coming.</p>';
        html += '</div></header>';

        html += '<div class="surface">';
        html += '  <div class="date-bar">';
        html += '    <button class="icon-btn" data-action="move-week" data-delta="-7" aria-label="Previous week">' + iconSvg("chevron-left", 20) + '</button>';
        html += '    <div style="font-size:15px;font-weight:600">' + escapeHtml(label) + '</div>';
        html += '    <button class="icon-btn" data-action="move-week" data-delta="7" aria-label="Next week">' + iconSvg("chevron-right", 20) + '</button>';
        html += '  </div>';
        html += '  <div class="day-strip">';
        for (var k = 0; k < days.length; k++) {
          var item = days[k];
          var isSel = item.dayKey === focusKey;
          var isToday = item.dayKey === todayKey;
          html += '    <button class="day-btn ' + (isSel ? "selected" : "") + '" data-action="select-week-day" data-date="' + item.dayKey + '">';
          html += '      <span style="font-size:10px;color:' + (isSel ? "var(--primary-fg)" : "var(--muted-fg)") + '">' + escapeHtml(item.date.toLocaleDateString([], { weekday: "short" })) + '</span>';
          html += '      <span style="font-size:14px;font-weight:600">' + item.date.getDate() + '</span>';
          html += '      <span class="today-dot" style="background:' + (isToday ? (isSel ? "var(--primary-fg)" : "var(--primary)") : "transparent") + '"></span>';
          html += '    </button>';
        }
        html += '  </div>';
        html += '</div>';

        html += '<section class="section-block" style="gap:12px">';
        html += '  <div class="section-heading">';
        html += '    <h2 class="section-title">Events</h2>';
        html += '    <button class="small-btn" data-action="add-event" data-date="' + focusKey + '">' + iconSvg("plus", 15) + '<span>Add event</span></button>';
        html += '  </div>';

        for (var m = 0; m < days.length; m++) {
          var dayObj = days[m];
          html += '  <div style="display:flex;flex-direction:column;gap:8px">';
          html += '    <div class="day-group-label">' + escapeHtml(dayObj.date.toLocaleDateString([], { weekday: "long", month: "short", day: "numeric" })) + '</div>';
          if (dayObj.events.length === 0) {
            html += '    <div style="font-size:13px;color:var(--muted-fg);padding:2px 0 4px 3px">No events planned</div>';
          } else {
            html += '    <div class="list-stack">';
            for (var n = 0; n < dayObj.events.length; n++) {
              var ev = dayObj.events[n];
              var catColor = "var(--cat-" + ev.category + ", var(--primary))";
              html += '      <button class="event-card" data-action="edit-event" data-id="' + escapeHtml(ev.id) + '">';
              html += '        <div class="event-line" style="background:' + catColor + '"></div>';
              html += '        <div class="event-content">';
              html += '          <div style="font-size:11px;color:var(--muted-fg)">' + escapeHtml(formatClock(ev.startsAt)) + ' – ' + escapeHtml(formatClock(ev.endsAt)) + '</div>';
              html += '          <div class="event-title" style="font-size:14px">' + escapeHtml(ev.title) + '</div>';
              html +=            renderCategoryChip(ev.category);
              html += '        </div>';
              html += '        <span style="color:var(--muted-fg);align-self:center">' + iconSvg("chevron-right", 17) + '</span>';
              html += '      </button>';
            }
            html += '    </div>';
          }
          html += '  </div>';
        }
        html += '</section>';
        return html;
      }

      function renderDue() {
        var items = plannerState.deadlines.slice().sort(function (a, b) {
          return Number(a.completed) - Number(b.completed) || a.dueAt.localeCompare(b.dueAt);
        });
        var remaining = items.filter(function (i) { return !i.completed; }).length;

        var html = '';
        html += '<header class="page-header"><div>';
        html += '  <div class="eyebrow">YOUR PLANNER</div>';
        html += '  <h1 class="page-title">Coming up</h1>';
        html += '  <p class="page-subtitle">Assignments and tests, in due-date order.</p>';
        html += '</div></header>';

        html += '<div class="surface summary-row">';
        html += '  <div class="summary-icon">' + iconSvg("book-open", 19) + '</div>';
        html += '  <div style="flex:1">';
        html += '    <div style="font-size:20px;font-weight:700">' + remaining + '</div>';
        html += '    <div style="font-size:12px;color:var(--muted-fg)">still to do</div>';
        html += '  </div>';
        html += '  <button class="small-btn" data-action="add-deadline">' + iconSvg("plus", 15) + '<span>Add due date</span></button>';
        html += '</div>';

        html += '<section class="section-block">';
        html += '  <div class="section-heading">';
        html += '    <h2 class="section-title">Your list</h2>';
        html += '    <span style="color:var(--muted-fg);font-size:12px">' + items.length + ' total</span>';
        html += '  </div>';

        if (items.length === 0) {
          html += '  <div class="surface"><div class="empty-state">';
          html += '    <div class="empty-icon">' + iconSvg("bookmark", 22) + '</div>';
          html += '    <h3 class="empty-title">No due dates yet</h3>';
          html += '    <p class="empty-desc">Keep assignments and tests here, sorted by when they’re due.</p>';
          html += '    <button class="small-btn" data-action="add-deadline">' + iconSvg("plus", 15) + '<span>Add due date</span></button>';
          html += '  </div></div>';
        } else {
          html += '  <div class="surface task-list-surface">';
          for (var i = 0; i < items.length; i++) {
            var item = items[i];
            var due = dueLabel(item.dueAt);
            var isOverdue = due.indexOf("Overdue") === 0 && !item.completed;
            var dueColor = isOverdue ? "var(--destructive)" : "var(--muted-fg)";
            html += '    <div class="task-row" style="min-height:82px">';
            html += '      <button class="checkbox-btn ' + (item.completed ? "checked" : "") + '" data-action="toggle-deadline" data-id="' + escapeHtml(item.id) + '" aria-label="Toggle due item">';
            if (item.completed) html += iconSvg("check", 14);
            html += '      </button>';
            html += '      <button class="task-text-wrap" data-action="edit-deadline" data-id="' + escapeHtml(item.id) + '">';
            html += '        <div style="display:flex;align-items:center;gap:7px">';
            html += '          <span class="task-title ' + (item.completed ? "completed" : "") + '" style="flex:1;font-weight:600">' + escapeHtml(item.title) + '</span>';
            html += '          <span style="font-size:9px;letter-spacing:0.5px;color:var(--muted-fg)">' + (item.kind === "test" ? "TEST" : "ASSIGNMENT") + '</span>';
            html += '        </div>';
            html += '        <div style="display:flex;align-items:center;gap:5px;font-size:11px;color:' + dueColor + '">';
            html +=            iconSvg("clock", 12) + '<span>' + escapeHtml(due) + ' · ' + escapeHtml(formatClock(item.dueAt)) + '</span>';
            html += '        </div>';
            if (item.notes) {
              html += '      <div style="font-size:12px;color:var(--muted-fg)">' + escapeHtml(item.notes) + '</div>';
            }
            html += '      </button>';
            html += '      <button class="icon-btn" data-action="edit-deadline" data-id="' + escapeHtml(item.id) + '" style="color:var(--muted-fg)">' + iconSvg("chevron-right", 18) + '</button>';
            html += '    </div>';
          }
          html += '  </div>';
        }
        html += '</section>';
        return html;
      }

      function renderBalance() {
        var weekStart = mondayOf(balanceFocusDate);
        var weekEnd = new Date(weekStart);
        weekEnd.setDate(weekEnd.getDate() + 7);
        var periodEnd = new Date(weekEnd.getTime() - 1);
        var period = weekStart.toLocaleDateString([], { month: "short", day: "numeric" }) + " – " +
          periodEnd.toLocaleDateString([], { month: "short", day: "numeric" });

        var totals = {};
        for (var i = 0; i < CATEGORIES.length; i++) totals[CATEGORIES[i]] = 0;
        var startMs = weekStart.getTime();
        var endMs = weekEnd.getTime();

        for (var j = 0; j < plannerState.events.length; j++) {
          var ev = plannerState.events[j];
          var evStart = new Date(ev.startsAt).getTime();
          var evEnd = new Date(ev.endsAt).getTime();
          var overlap = Math.max(0, Math.min(evEnd, endMs) - Math.max(evStart, startMs));
          if (overlap > 0 && totals[ev.category] !== undefined) {
            totals[ev.category] += overlap / 60000;
          }
        }

        var totalMinutes = 0;
        var rounded = {};
        for (var k = 0; k < CATEGORIES.length; k++) {
          var cat = CATEGORIES[k];
          rounded[cat] = Math.round(totals[cat]);
          totalMinutes += rounded[cat];
        }

        var html = '';
        html += '<header class="page-header"><div>';
        html += '  <div class="eyebrow">YOUR PLANNER</div>';
        html += '  <h1 class="page-title">Balance</h1>';
        html += '  <p class="page-subtitle">How your planned time is shared.</p>';
        html += '</div></header>';

        html += '<div class="surface summary-row">';
        html += '  <div class="summary-icon">' + iconSvg("pie-chart", 20) + '</div>';
        html += '  <div>';
        html += '    <div style="font-size:23px;font-weight:700">' + durationLabel(totalMinutes) + '</div>';
        html += '    <div style="font-size:12px;color:var(--muted-fg)">planned this week</div>';
        html += '  </div>';
        html += '</div>';

        html += '<div class="surface" style="gap:16px">';
        html += '  <div class="date-bar">';
        html += '    <button class="icon-btn" data-action="move-balance-week" data-delta="-7" aria-label="Previous week">' + iconSvg("chevron-left", 20) + '</button>';
        html += '    <div style="font-size:14px;font-weight:600">' + escapeHtml(period) + '</div>';
        html += '    <button class="icon-btn" data-action="move-balance-week" data-delta="7" aria-label="Next week">' + iconSvg("chevron-right", 20) + '</button>';
        html += '  </div>';
        html += '  <h2 class="section-title">Time by category</h2>';

        if (totalMinutes > 0) {
          html += '  <div style="display:flex;flex-direction:column;gap:16px">';
          for (var c = 0; c < CATEGORIES.length; c++) {
            var category = CATEGORIES[c];
            var mins = rounded[category];
            var pct = totalMinutes ? Math.round((mins / totalMinutes) * 100) : 0;
            var colorVar = "var(--cat-" + category + ", var(--primary))";
            html += '    <div style="display:flex;flex-direction:column;gap:7px">';
            html += '      <div style="display:flex;justify-content:space-between;align-items:center">';
            html += '        <div style="display:flex;align-items:center;gap:8px">';
            html += '          <span class="category-dot" style="width:8px;height:8px;background:' + colorVar + '"></span>';
            html += '          <span style="font-size:13px;font-weight:500">' + escapeHtml(category) + '</span>';
            html += '        </div>';
            html += '        <span style="font-size:11px;color:var(--muted-fg)">' + durationLabel(mins) + ' · ' + pct + '%</span>';
            html += '      </div>';
            html += '      <div class="progress-track"><div class="progress-fill" style="width:' + pct + '%;background:' + colorVar + '"></div></div>';
            html += '    </div>';
          }
          html += '  </div>';
        } else {
          html += '  <div class="empty-state">';
          html += '    <div class="empty-icon">' + iconSvg("clock", 22) + '</div>';
          html += '    <h3 class="empty-title">No time planned yet</h3>';
          html += '    <p class="empty-desc">Add events to your week to see how your time is divided.</p>';
          html += '  </div>';
        }
        html += '</div>';
        return html;
      }

      function renderSettings() {
        var totalItems = plannerState.tasks.length + plannerState.events.length + plannerState.deadlines.length;
        var modeLabels = {
          system: "Use device setting",
          light: "Light",
          dark: "Dark"
        };

        var html = '';
        html += '<header class="page-header"><div>';
        html += '  <div class="eyebrow">YOUR PLANNER</div>';
        html += '  <h1 class="page-title">Settings</h1>';
        html += '  <p class="page-subtitle">Your appearance, easy app setup, and local backups.</p>';
        html += '</div></header>';

        html += '<div class="surface summary-row">';
        html += '  <div class="summary-icon">' + iconSvg("hard-drive", 19) + '</div>';
        html += '  <div style="flex:1">';
        html += '    <div style="font-size:14px;font-weight:600">Stored 100% on this device</div>';
        html += '    <div style="font-size:12px;color:var(--muted-fg);line-height:18px">Your ' + totalItems + ' planner items stay private on your device. Nothing is sent to any server.</div>';
        html += '  </div>';
        html += '</div>';

        // Single-File Save & Easy Non-Tech Setup Card
        html += '<section class="section-block">';
        html += '  <h2 class="section-title" style="font-size:15px">Portable Single-File App & One-Click Setup</h2>';
        html += '  <div class="surface" style="gap:14px">';
        html += '    <div style="font-size:13px;color:var(--muted-fg);line-height:19px">';
        html += '      You can save all your tasks and schedule <strong>directly inside this HTML file</strong>. That way you can keep the file on your Desktop, email/AirDrop it to your phone, or move it to another computer without losing anything.';
        html += '    </div>';
        html += '    <button class="primary-block-btn" data-action="save-html-file">' + iconSvg("save", 18) + '<span>Save Updated Planner File (.html)</span></button>';
        html += '    <div style="border-top:1px solid var(--border);padding-top:12px;display:flex;flex-direction:column;gap:8px">';
        html += '      <div style="font-size:13px;font-weight:600;display:flex;align-items:center;gap:6px">' + iconSvg("smartphone", 16) + '<span>How to open with 1 click (No extra downloads):</span></div>';
        html += '      <div class="guide-step"><span class="guide-badge">1</span><span><strong>Computer (Windows / Mac):</strong> Put <code>Giuliana-Planner.html</code> on your Desktop and double-click it anytime. It opens right in your browser and works offline.</span></div>';
        html += '      <div class="guide-step"><span class="guide-badge">2</span><span><strong>iPhone / Android (Web link):</strong> Open the planner in Safari (iPhone) or Chrome (Android), tap <strong>Share → Add to Home Screen</strong> (or <strong>Install App</strong>) for a 1-tap Home Screen icon.</span></div>';
        html += '      <div class="guide-step"><span class="guide-badge">3</span><span><strong>Moving between devices:</strong> Tap <em>Save Updated Planner File (.html)</em> above (or Export JSON below) and send that single file to your other device!</span></div>';
        html += '    </div>';
        html += '  </div>';
        html += '</section>';

        // Appearance
        html += '<section class="section-block">';
        html += '  <h2 class="section-title" style="font-size:15px">Appearance</h2>';
        html += '  <div class="surface" style="padding:0 14px;gap:0">';
        var modes = ["system", "light", "dark"];
        for (var i = 0; i < modes.length; i++) {
          var m = modes[i];
          var active = themeMode === m;
          html += '    <button class="mode-row" data-action="set-theme" data-mode="' + m + '">';
          html += '      <span>' + escapeHtml(modeLabels[m]) + '</span>';
          html += '      <span style="color:' + (active ? "var(--primary)" : "var(--muted-fg)") + ';display:flex">' + iconSvg(active ? "check-circle" : "circle", 20) + '</span>';
          html += '    </button>';
        }
        html += '  </div>';
        html += '</section>';

        // Backups
        html += '<section class="section-block">';
        html += '  <h2 class="section-title" style="font-size:15px">Backups</h2>';
        html += '  <div class="surface">';
        html += '    <div style="font-size:13px;color:var(--muted-fg);line-height:19px">';
        html += '      Export includes tasks, events, assignments, and tests. Import accepts either a <code>.json</code> backup or another <code>Giuliana-Planner.html</code> file.';
        html += '    </div>';
        html += '    <button class="secondary-block-btn" data-action="export-backup">' + iconSvg("download", 18) + '<span>Export JSON backup</span></button>';
        html += '    <button class="outline-block-btn" data-action="import-backup">' + iconSvg("upload", 18) + '<span>Import backup (.json or .html)</span></button>';
        if (settingsMessage) {
          html += '  <div style="font-size:12px;color:var(--primary);font-weight:500;line-height:18px">' + escapeHtml(settingsMessage) + '</div>';
        }
        html += '  </div>';
        html += '</section>';

        return html;
      }

      function renderTabs() {
        var tabs = [
          { id: "today", label: "Today", icon: currentTab === "today" ? "sun" : "sunrise" },
          { id: "week", label: "Week", icon: "calendar" },
          { id: "due", label: "Due", icon: "bookmark" },
          { id: "balance", label: "Balance", icon: "bar-chart-2" },
          { id: "settings", label: "Settings", icon: "settings" }
        ];
        var html = "";
        for (var i = 0; i < tabs.length; i++) {
          var t = tabs[i];
          var isAct = currentTab === t.id;
          html += '<button class="tab-btn ' + (isAct ? "active" : "") + '" data-action="go-tab" data-tab="' + t.id + '">';
          html +=   iconSvg(t.icon, 19);
          html += '  <span>' + escapeHtml(t.label) + '</span>';
          html += '</button>';
        }
        document.getElementById("tab-bar").innerHTML = html;
      }

      function renderModal() {
        var root = document.getElementById("modal-root");
        if (pendingBackup) {
          var bHtml = '';
          bHtml += '<div class="modal-backdrop" data-action="close-backup-modal">';
          bHtml += '  <div class="modal-sheet" onclick="event.stopPropagation()" style="max-width:440px">';
          bHtml += '    <h2 style="margin:0;font-size:19px;font-weight:700">Import backup</h2>';
          bHtml += '    <p style="margin:0;font-size:13px;color:var(--muted-fg);line-height:20px">Choose whether to replace the planner on this device or merge in items from <strong>' + escapeHtml(pendingBackup.fileName) + '</strong>.</p>';
          bHtml += '    <button class="primary-block-btn" style="background:var(--destructive);color:var(--destructive-fg)" data-action="apply-import" data-mode="replace">Replace current data</button>';
          bHtml += '    <button class="primary-block-btn" data-action="apply-import" data-mode="merge">Merge with current data</button>';
          bHtml += '    <button class="outline-block-btn" data-action="close-backup-modal">Cancel</button>';
          bHtml += '  </div>';
          bHtml += '</div>';
          root.innerHTML = bHtml;
          return;
        }

        if (!activeModal) {
          root.innerHTML = "";
          return;
        }

        var m = activeModal;
        var kindLabel = m.kind === "task" ? "task" : m.kind === "event" ? "event" : "due date";
        var heading = (m.id ? "Edit " : "Add ") + kindLabel;

        var html = '';
        html += '<div class="modal-backdrop" data-action="close-modal">';
        html += '  <div class="modal-sheet" onclick="event.stopPropagation()">';
        html += '    <div style="display:flex;align-items:center;gap:12px">';
        html += '      <button class="icon-btn" data-action="close-modal" aria-label="Close form">' + iconSvg("x", 21) + '</button>';
        html += '      <h2 style="margin:0;font-size:22px;font-weight:700;flex:1">' + escapeHtml(heading) + '</h2>';
        html += '    </div>';

        html += '    <div class="field">';
        html += '      <label class="field-label" for="f-title">Title</label>';
        html += '      <input id="f-title" class="text-input" type="text" maxlength="160" placeholder="What do you need to remember?" value="' + escapeHtml(m.title) + '" />';
        html += '    </div>';

        if (m.kind === "deadline") {
          html += '  <div class="field">';
          html += '    <span class="field-label">Type</span>';
          html += '    <div class="two-col">';
          html += '      <button type="button" class="pill-option ' + (m.deadlineKind === "assignment" ? "active" : "") + '" style="min-height:44px;border-radius:14px" data-action="set-deadline-kind" data-kind="assignment">Assignment</button>';
          html += '      <button type="button" class="pill-option ' + (m.deadlineKind === "test" ? "active" : "") + '" style="min-height:44px;border-radius:14px" data-action="set-deadline-kind" data-kind="test">Test</button>';
          html += '    </div>';
          html += '  </div>';
        }

        html += '    <div class="' + (m.kind === "event" ? "" : "two-col") + '" style="display:grid;gap:10px">';
        html += '      <div class="field">';
        html += '        <label class="field-label" for="f-date">' + (m.kind === "deadline" ? "Due date" : "Date") + '</label>';
        html += '        <input id="f-date" class="text-input" type="date" value="' + escapeHtml(m.date) + '" />';
        html += '      </div>';

        if (m.kind !== "event") {
          html += '    <div class="field">';
          html += '      <label class="field-label" for="f-time">' + (m.kind === "deadline" ? "Due time" : "Time (optional)") + '</label>';
          html += '      <input id="f-time" class="text-input" type="time" value="' + escapeHtml(m.time) + '" />';
          html += '    </div>';
        }
        html += '    </div>';

        if (m.kind === "event") {
          html += '  <div class="two-col">';
          html += '    <div class="field">';
          html += '      <label class="field-label" for="f-time">Start time</label>';
          html += '      <input id="f-time" class="text-input" type="time" value="' + escapeHtml(m.time) + '" />';
          html += '    </div>';
          html += '    <div class="field">';
          html += '      <label class="field-label" for="f-end-time">End time</label>';
          html += '      <input id="f-end-time" class="text-input" type="time" value="' + escapeHtml(m.endTime) + '" />';
          html += '    </div>';
          html += '  </div>';
        }

        if (m.kind !== "deadline") {
          html += '  <div class="field">';
          html += '    <span class="field-label">Category</span>';
          html += '    <div class="pill-group">';
          for (var i = 0; i < CATEGORIES.length; i++) {
            var cat = CATEGORIES[i];
            html += '    <button type="button" class="pill-option ' + (m.category === cat ? "active" : "") + '" data-action="set-category" data-category="' + cat + '">' + escapeHtml(cat) + '</button>';
          }
          html += '    </div>';
          html += '  </div>';
        }

        html += '    <div class="field">';
        html += '      <label class="field-label" for="f-notes">Notes (optional)</label>';
        html += '      <textarea id="f-notes" class="text-input" maxlength="4000" placeholder="Add a few details">' + escapeHtml(m.notes) + '</textarea>';
        html += '    </div>';

        if (m.id && m.kind !== "event") {
          html += '  <button type="button" style="display:flex;align-items:center;gap:10px;min-height:40px" data-action="toggle-modal-completed">';
          html += '    <span class="checkbox-btn ' + (m.completed ? "checked" : "") + '">' + (m.completed ? iconSvg("check", 13) : "") + '</span>';
          html += '    <span>Mark as complete</span>';
          html += '  </button>';
        }

        if (m.error) {
          html += '  <div style="color:var(--destructive);font-size:12px;font-weight:500" role="alert">' + escapeHtml(m.error) + '</div>';
        }

        html += '    <button type="button" class="primary-block-btn" data-action="save-modal">Save</button>';

        if (m.id) {
          html += '  <button type="button" style="min-height:42px;display:flex;align-items:center;justify-content:center;gap:7px;color:var(--destructive);font-weight:600" data-action="delete-modal">';
          html +=      iconSvg("trash-2", 16) + '<span>Delete</span>';
          html += '  </button>';
        }

        html += '  </div>';
        html += '</div>';
        root.innerHTML = html;
      }

      function syncModalInputs() {
        if (!activeModal) return;
        var titleEl = document.getElementById("f-title");
        var dateEl = document.getElementById("f-date");
        var timeEl = document.getElementById("f-time");
        var endTimeEl = document.getElementById("f-end-time");
        var notesEl = document.getElementById("f-notes");
        if (titleEl) activeModal.title = titleEl.value;
        if (dateEl) activeModal.date = dateEl.value;
        if (timeEl) activeModal.time = timeEl.value;
        if (endTimeEl) activeModal.endTime = endTimeEl.value;
        if (notesEl) activeModal.notes = notesEl.value;
      }

      function saveModalItem() {
        syncModalInputs();
        var m = activeModal;
        if (!m) return;
        var cleanTitle = (m.title || "").trim();
        if (!cleanTitle) {
          m.error = "Add a title before saving.";
          renderModal();
          return;
        }
        if (!/^\\d{4}-\\d{2}-\\d{2}$/.test(m.date)) {
          m.error = "Choose a valid date.";
          renderModal();
          return;
        }

        if (m.kind === "task") {
          if (m.id) {
            plannerState.tasks = plannerState.tasks.map(function (t) {
              return t.id === m.id
                ? Object.assign({}, t, {
                    title: cleanTitle,
                    date: m.date,
                    time: (m.time || "").trim() || null,
                    category: m.category,
                    notes: (m.notes || "").trim() || null,
                    completed: m.completed
                  })
                : t;
            });
          } else {
            plannerState.tasks.push({
              id: createId(),
              title: cleanTitle,
              date: m.date,
              time: (m.time || "").trim() || null,
              category: m.category,
              notes: (m.notes || "").trim() || null,
              completed: false,
              createdAt: new Date().toISOString()
            });
          }
        } else if (m.kind === "event") {
          if (!/^\\d{2}:\\d{2}$/.test(m.time) || !/^\\d{2}:\\d{2}$/.test(m.endTime)) {
            m.error = "Choose valid start and end times.";
            renderModal();
            return;
          }
          var startsAt = new Date(m.date + "T" + m.time + ":00");
          var endsAt = new Date(m.date + "T" + m.endTime + ":00");
          if (isNaN(startsAt.getTime()) || endsAt <= startsAt) {
            m.error = "The end time must be later than the start time.";
            renderModal();
            return;
          }
          if (m.id) {
            plannerState.events = plannerState.events.map(function (ev) {
              return ev.id === m.id
                ? Object.assign({}, ev, {
                    title: cleanTitle,
                    category: m.category,
                    notes: (m.notes || "").trim() || null,
                    startsAt: startsAt.toISOString(),
                    endsAt: endsAt.toISOString()
                  })
                : ev;
            });
          } else {
            plannerState.events.push({
              id: createId(),
              title: cleanTitle,
              category: m.category,
              notes: (m.notes || "").trim() || null,
              startsAt: startsAt.toISOString(),
              endsAt: endsAt.toISOString(),
              createdAt: new Date().toISOString()
            });
          }
        } else if (m.kind === "deadline") {
          var timeStr = /^\\d{2}:\\d{2}$/.test(m.time) ? m.time : "23:59";
          var dueAt = new Date(m.date + "T" + timeStr + ":00");
          if (m.id) {
            plannerState.deadlines = plannerState.deadlines.map(function (d) {
              return d.id === m.id
                ? Object.assign({}, d, {
                    title: cleanTitle,
                    kind: m.deadlineKind,
                    dueAt: dueAt.toISOString(),
                    notes: (m.notes || "").trim() || null,
                    completed: m.completed
                  })
                : d;
            });
          } else {
            plannerState.deadlines.push({
              id: createId(),
              title: cleanTitle,
              kind: m.deadlineKind,
              dueAt: dueAt.toISOString(),
              notes: (m.notes || "").trim() || null,
              completed: false,
              createdAt: new Date().toISOString()
            });
          }
        }

        activeModal = null;
        saveState();
        render();
      }

      function deleteModalItem() {
        var m = activeModal;
        if (!m || !m.id) return;
        if (!window.confirm("Delete this planner item?")) return;
        if (m.kind === "task") {
          plannerState.tasks = plannerState.tasks.filter(function (t) { return t.id !== m.id; });
        } else if (m.kind === "event") {
          plannerState.events = plannerState.events.filter(function (e) { return e.id !== m.id; });
        } else if (m.kind === "deadline") {
          plannerState.deadlines = plannerState.deadlines.filter(function (d) { return d.id !== m.id; });
        }
        activeModal = null;
        saveState();
        render();
      }

      function render() {
        var app = document.getElementById("app");
        if (currentTab === "today") app.innerHTML = renderToday();
        else if (currentTab === "week") app.innerHTML = renderWeek();
        else if (currentTab === "due") app.innerHTML = renderDue();
        else if (currentTab === "balance") app.innerHTML = renderBalance();
        else if (currentTab === "settings") app.innerHTML = renderSettings();
        renderTabs();
        renderModal();
      }

      document.addEventListener("click", function (ev) {
        var btn = ev.target.closest("[data-action]");
        if (!btn) return;
        var action = btn.getAttribute("data-action");

        if (action === "go-tab") {
          currentTab = btn.getAttribute("data-tab") || "today";
          settingsMessage = "";
          window.scrollTo(0, 0);
          render();
        } else if (action === "move-day") {
          var delta = Number(btn.getAttribute("data-delta") || 0);
          selectedDate = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), selectedDate.getDate() + delta);
          render();
        } else if (action === "move-week") {
          var wDelta = Number(btn.getAttribute("data-delta") || 0);
          weekFocusDate = new Date(weekFocusDate.getFullYear(), weekFocusDate.getMonth(), weekFocusDate.getDate() + wDelta);
          render();
        } else if (action === "select-week-day") {
          var dStr = btn.getAttribute("data-date");
          if (dStr) weekFocusDate = new Date(dStr + "T12:00:00");
          render();
        } else if (action === "move-balance-week") {
          var bDelta = Number(btn.getAttribute("data-delta") || 0);
          balanceFocusDate = new Date(balanceFocusDate.getFullYear(), balanceFocusDate.getMonth(), balanceFocusDate.getDate() + bDelta);
          render();
        } else if (action === "add-task") {
          openItemModal({ kind: "task", date: btn.getAttribute("data-date") || dateToInput(selectedDate), time: "" });
        } else if (action === "add-event") {
          openItemModal({ kind: "event", date: btn.getAttribute("data-date") || dateToInput(selectedDate), time: "15:00", endTime: "16:00" });
        } else if (action === "add-deadline") {
          var defDue = new Date();
          defDue.setDate(defDue.getDate() + 3);
          openItemModal({ kind: "deadline", date: dateToInput(defDue), time: "15:00", deadlineKind: "assignment" });
        } else if (action === "toggle-task") {
          var tid = btn.getAttribute("data-id");
          plannerState.tasks = plannerState.tasks.map(function (t) {
            return t.id === tid ? Object.assign({}, t, { completed: !t.completed }) : t;
          });
          saveState();
          render();
        } else if (action === "edit-task") {
          var editTid = btn.getAttribute("data-id");
          var task = plannerState.tasks.find(function (t) { return t.id === editTid; });
          if (task) {
            openItemModal({
              kind: "task",
              id: task.id,
              title: task.title,
              date: task.date,
              time: task.time || "",
              category: task.category,
              notes: task.notes || "",
              completed: task.completed
            });
          }
        } else if (action === "edit-event") {
          var editEid = btn.getAttribute("data-id");
          var eventObj = plannerState.events.find(function (e) { return e.id === editEid; });
          if (eventObj) {
            var st = new Date(eventObj.startsAt);
            var et = new Date(eventObj.endsAt);
            openItemModal({
              kind: "event",
              id: eventObj.id,
              title: eventObj.title,
              date: dateToInput(st),
              time: String(st.getHours()).padStart(2, "0") + ":" + String(st.getMinutes()).padStart(2, "0"),
              endTime: String(et.getHours()).padStart(2, "0") + ":" + String(et.getMinutes()).padStart(2, "0"),
              category: eventObj.category,
              notes: eventObj.notes || ""
            });
          }
        } else if (action === "toggle-deadline") {
          var did = btn.getAttribute("data-id");
          plannerState.deadlines = plannerState.deadlines.map(function (d) {
            return d.id === did ? Object.assign({}, d, { completed: !d.completed }) : d;
          });
          saveState();
          render();
        } else if (action === "edit-deadline") {
          var editDid = btn.getAttribute("data-id");
          var dl = plannerState.deadlines.find(function (d) { return d.id === editDid; });
          if (dl) {
            var dt = new Date(dl.dueAt);
            openItemModal({
              kind: "deadline",
              id: dl.id,
              title: dl.title,
              date: dateToInput(dt),
              time: String(dt.getHours()).padStart(2, "0") + ":" + String(dt.getMinutes()).padStart(2, "0"),
              deadlineKind: dl.kind,
              notes: dl.notes || "",
              completed: dl.completed
            });
          }
        } else if (action === "set-theme") {
          themeMode = btn.getAttribute("data-mode") || "system";
          try { window.localStorage.setItem(MODE_KEY, themeMode); } catch (e) {}
          applyTheme();
          render();
        } else if (action === "save-html-file") {
          saveSelfContainedHtmlFile();
        } else if (action === "export-backup") {
          exportJsonBackup();
        } else if (action === "import-backup") {
          chooseJsonBackup();
        } else if (action === "apply-import") {
          applyImport(btn.getAttribute("data-mode") || "merge");
        } else if (action === "close-backup-modal") {
          pendingBackup = null;
          renderModal();
        } else if (action === "close-modal") {
          activeModal = null;
          renderModal();
        } else if (action === "set-category") {
          syncModalInputs();
          if (activeModal) {
            activeModal.category = btn.getAttribute("data-category") || "School";
            renderModal();
          }
        } else if (action === "set-deadline-kind") {
          syncModalInputs();
          if (activeModal) {
            activeModal.deadlineKind = btn.getAttribute("data-kind") === "test" ? "test" : "assignment";
            renderModal();
          }
        } else if (action === "toggle-modal-completed") {
          syncModalInputs();
          if (activeModal) {
            activeModal.completed = !activeModal.completed;
            renderModal();
          }
        } else if (action === "save-modal") {
          saveModalItem();
        } else if (action === "delete-modal") {
          deleteModalItem();
        }
      });

      render();
    })();
  </script>
</body>
</html>
`;

await writeFile(outputPath, html, "utf8");
console.log(`Single-file app written to ${outputPath}`);
