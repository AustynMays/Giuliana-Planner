import { execFileSync } from "node:child_process";
import { createRequire } from "node:module";
import { cp, mkdir, readdir, readFile, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const scriptDirectory = dirname(fileURLToPath(import.meta.url));
const projectDirectory = resolve(scriptDirectory, "..");
const outputDirectory = resolve(projectDirectory, "dist");
const publicDirectory = resolve(projectDirectory, "public");

// BASE_URL lets the site live in a sub-folder, e.g. "/Giuliana-Planner" on
// GitHub Pages. Leave it empty when the site is served from the root.
const baseUrl = (process.env.BASE_URL || "").replace(/\/+$/, "");
const prefix = `${baseUrl}/`;

// Run the Expo CLI through Node directly so this works the same on
// Windows, macOS, and Linux without depending on a specific package manager.
const require = createRequire(import.meta.url);
const expoCli = require.resolve("expo/bin/cli", { paths: [projectDirectory] });

execFileSync(
  process.execPath,
  [expoCli, "export", "--platform", "web", "--output-dir", "dist"],
  {
    cwd: projectDirectory,
    stdio: "inherit",
  },
);

await cp(publicDirectory, outputDirectory, { recursive: true, force: true });
const workerPath = resolve(outputDirectory, "sw.js");
const workerSource = await readFile(workerPath, "utf8");
if (!workerSource.includes("__BUILD_TIMESTAMP__")) {
  throw new Error("The service worker cache-name placeholder is missing.");
}
const buildTimestamp = new Date().toISOString().replace(/\D/g, "");
await writeFile(
  workerPath,
  workerSource.replace("__BUILD_TIMESTAMP__", buildTimestamp),
);

const pwaHead = [
  `<link rel="manifest" href="${prefix}manifest.json">`,
  '<meta name="theme-color" content="#315a46">',
  '<meta name="mobile-web-app-capable" content="yes">',
  '<meta name="apple-mobile-web-app-capable" content="yes">',
  '<meta name="apple-mobile-web-app-status-bar-style" content="default">',
  '<meta name="apple-mobile-web-app-title" content="Planner">',
  `<link rel="apple-touch-icon" href="${prefix}icons/icon-192.png">`,
].join("\n");

const workerRegistration = `<style>
  #pwa-update-banner {
    position: fixed;
    z-index: 9999;
    left: 50%;
    bottom: max(16px, env(safe-area-inset-bottom));
    transform: translateX(-50%);
    border: 0;
    border-radius: 999px;
    padding: 10px 16px;
    color: #fff;
    background: #315a46;
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.2);
    font: 500 14px/1.3 system-ui, sans-serif;
    cursor: pointer;
    white-space: nowrap;
  }
  #pwa-update-banner[hidden] { display: none; }
</style>
<button id="pwa-update-banner" type="button" aria-live="polite" hidden>
  Update available — tap to refresh
</button>
<script>
  if ("serviceWorker" in navigator) {
    var updateBanner = document.getElementById("pwa-update-banner");
    var workerRegistration = null;
    var updateRequested = false;
    function showUpdateNotice() {
      updateBanner.hidden = false;
    }
    function watchForUpdates(registration) {
      if (registration.waiting && navigator.serviceWorker.controller) {
        showUpdateNotice();
      }
      registration.addEventListener("updatefound", function () {
        var installing = registration.installing;
        if (!installing) return;
        installing.addEventListener("statechange", function () {
          if (installing.state === "installed" && navigator.serviceWorker.controller) {
            showUpdateNotice();
          }
        });
      });
    }
    updateBanner.addEventListener("click", function () {
      if (!workerRegistration || !workerRegistration.waiting) return;
      updateRequested = true;
      workerRegistration.waiting.postMessage({ type: "SKIP_WAITING" });
    });
    navigator.serviceWorker.addEventListener("controllerchange", function () {
      if (updateRequested) window.location.reload();
    });
    window.addEventListener("load", function () {
      navigator.serviceWorker.register("${prefix}sw.js", { scope: "${prefix}", updateViaCache: "none" })
        .then(function (registration) {
          workerRegistration = registration;
          watchForUpdates(registration);
          registration.update().catch(function () {});
        })
        .catch(function (error) { console.warn("Offline support could not start.", error); });
    });
  }
</script>`;
// Add the install tags and offline/update script to every page, so the app
// can be installed and updated no matter which screen it was opened on.
async function htmlFiles(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = await Promise.all(
    entries.map((entry) => {
      const full = resolve(directory, entry.name);
      if (entry.isDirectory()) return entry.name === "_expo" ? [] : htmlFiles(full);
      return entry.name.endsWith(".html") ? [full] : [];
    }),
  );
  return files.flat();
}

for (const file of await htmlFiles(outputDirectory)) {
  let html = await readFile(file, "utf8");
  if (!html.includes('rel="manifest"')) {
    html = html.replace("</head>", `${pwaHead}\n</head>`);
  }
  if (!html.includes("pwa-update-banner")) {
    html = html.replace("</body>", `${workerRegistration}\n</body>`);
  }
  await writeFile(file, html);
}

// GitHub Pages: don't treat folders starting with "_" (like _expo) as hidden.
await writeFile(resolve(outputDirectory, ".nojekyll"), "");

console.log(`Static PWA exported to ${outputDirectory} (base path "${prefix}")`);
