import { execFileSync } from "node:child_process";
import { cp, mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const scriptDirectory = dirname(fileURLToPath(import.meta.url));
const projectDirectory = resolve(scriptDirectory, "..");
const outputDirectory = resolve(projectDirectory, "dist");
const publicDirectory = resolve(projectDirectory, "public");

execFileSync(
  "pnpm",
  ["exec", "expo", "export", "--platform", "web", "--output-dir", "dist"],
  {
    cwd: projectDirectory,
    stdio: "inherit",
    env: { ...process.env, RCT_METRO_PORT: process.env.RCT_METRO_PORT || "18116" },
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

const indexPath = resolve(outputDirectory, "index.html");
let html = await readFile(indexPath, "utf8");

const pwaHead = [
  '<link rel="manifest" href="/manifest.json">',
  '<meta name="theme-color" content="#315a46">',
  '<meta name="mobile-web-app-capable" content="yes">',
  '<meta name="apple-mobile-web-app-capable" content="yes">',
  '<meta name="apple-mobile-web-app-status-bar-style" content="default">',
  '<link rel="apple-touch-icon" href="/icons/icon-192.png">',
].join("\n");
if (!html.includes('rel="manifest"')) {
  html = html.replace("</head>", `${pwaHead}\n</head>`);
}

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
      navigator.serviceWorker.register("/sw.js", { scope: "/", updateViaCache: "none" })
        .then(function (registration) {
          workerRegistration = registration;
          watchForUpdates(registration);
          registration.update().catch(function () {});
        })
        .catch(function (error) { console.warn("Offline support could not start.", error); });
    });
  }
</script>`;
if (!html.includes('serviceWorker.register("/sw.js"')) {
  html = html.replace("</body>", `${workerRegistration}\n</body>`);
}

await writeFile(indexPath, html);
console.log(`Static PWA exported to ${outputDirectory}`);
