const http = require("node:http");
const fs = require("node:fs");
const path = require("node:path");

const root = path.resolve(__dirname, "..", "dist");
const port = Number.parseInt(process.env.PORT || "8081", 10);
const mimeTypes = {
  ".css": "text/css; charset=utf-8",
  ".html": "text/html; charset=utf-8",
  ".ico": "image/x-icon",
  ".js": "application/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".map": "application/json; charset=utf-8",
  ".png": "image/png",
  ".svg": "image/svg+xml",
  ".ttf": "font/ttf",
  ".woff": "font/woff",
  ".woff2": "font/woff2",
};

http
  .createServer((request, response) => {
    if (request.method !== "GET" && request.method !== "HEAD") {
      response.writeHead(405, { Allow: "GET, HEAD" });
      response.end();
      return;
    }

    let pathname;
    try {
      pathname = decodeURIComponent(new URL(request.url || "/", "http://localhost").pathname);
    } catch {
      response.writeHead(400);
      response.end("Bad request");
      return;
    }

    const requestedPath = path.resolve(root, `.${pathname}`);
    if (!requestedPath.startsWith(`${root}${path.sep}`) && requestedPath !== root) {
      response.writeHead(403);
      response.end("Forbidden");
      return;
    }

    let filePath = requestedPath;
    if (fs.existsSync(filePath) && fs.statSync(filePath).isDirectory()) {
      filePath = path.join(filePath, "index.html");
    }
    if (!fs.existsSync(filePath) || !fs.statSync(filePath).isFile()) {
      filePath = path.join(root, "index.html");
    }
    if (!fs.existsSync(filePath)) {
      response.writeHead(503);
      response.end("Static site has not been built.");
      return;
    }

    const isShell = path.basename(filePath) === "index.html" || path.basename(filePath) === "sw.js";
    response.writeHead(200, {
      "Content-Type": mimeTypes[path.extname(filePath)] || "application/octet-stream",
      "Cache-Control": isShell ? "no-cache" : "public, max-age=31536000, immutable",
      "Service-Worker-Allowed": "/",
      "X-Content-Type-Options": "nosniff",
    });
    if (request.method === "HEAD") {
      response.end();
    } else {
      fs.createReadStream(filePath).pipe(response);
    }
  })
  .listen(port, "0.0.0.0", () => {
    console.log(`Serving the static Senior Planner PWA on port ${port}.`);
  });
