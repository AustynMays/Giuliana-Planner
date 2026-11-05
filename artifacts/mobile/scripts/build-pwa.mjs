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

const workerRegistration = `<script>
  if ("serviceWorker" in navigator) {
    window.addEventListener("load", function () {
      navigator.serviceWorker.register("/sw.js", { scope: "/" })
        .catch(function (error) { console.warn("Offline support could not start.", error); });
    });
  }
</script>`;
if (!html.includes('serviceWorker.register("/sw.js"')) {
  html = html.replace("</body>", `${workerRegistration}\n</body>`);
}

await writeFile(indexPath, html);
console.log(`Static PWA exported to ${outputDirectory}`);
