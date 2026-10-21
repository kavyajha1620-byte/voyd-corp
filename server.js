const http = require("node:http");
const fs = require("node:fs");
const path = require("node:path");

const root = __dirname;
const port = Number(process.env.PORT) || 4173;

const types = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
  ".woff2": "font/woff2",
  ".ico": "image/x-icon"
};

// Local preview only. Secrets live in a file that is never committed.
try {
  process.loadEnvFile(path.join(root, ".env.local"));
} catch (err) {
  /* no local env file: the API will report that it is unconfigured */
}

const handlerCache = new Map();

function parseQuery(rawUrl) {
  const index = rawUrl.indexOf("?");
  if (index < 0) return {};
  const params = new URLSearchParams(rawUrl.slice(index + 1));
  const query = {};
  for (const [key, value] of params) query[key] = value;
  return query;
}

function resolveApi(urlPath) {
  const match = /^\/api\/([a-zA-Z0-9_-]+)\/?$/.exec(urlPath);
  if (!match) return null;
  if (match[1].startsWith("_")) return null;
  const file = path.join(root, "api", `${match[1]}.js`);
  if (!fs.existsSync(file)) return null;
  return file;
}

const server = http.createServer(async (request, response) => {
  const urlPath = decodeURIComponent((request.url || "/").split("?")[0]);
  delete request.body;

  const apiFile = resolveApi(urlPath);
  if (apiFile) {
    try {
      if (!handlerCache.has(apiFile)) {
        handlerCache.set(apiFile, require(apiFile));
      }
      const handler = handlerCache.get(apiFile);
      request.query = parseQuery(request.url || "");
      await handler(request, response);
    } catch (err) {
      console.error("[local api]", err);
      if (!response.headersSent) {
        response.writeHead(500, { "Content-Type": "application/json; charset=utf-8" });
        response.end(JSON.stringify({ error: "server_error", message: "Local API handler failed." }));
      } else if (!response.writableEnded) {
        response.end();
      }
    }
    return;
  }

  const relative = urlPath === "/" ? "index.html" : urlPath.replace(/^\/+/, "");
  let filePath = path.resolve(root, relative);

  if (!filePath.startsWith(root + path.sep) && filePath !== path.join(root, "index.html")) {
    response.writeHead(403);
    response.end("Forbidden");
    return;
  }

  // Match Vercel's cleanUrls: resolve /dir -> /dir/index.html and /page -> /page.html
  // when the literal path is not a file. Local preview parity only.
  try {
    const stat = fs.statSync(filePath);
    if (stat.isDirectory()) {
      filePath = path.join(filePath, "index.html");
    }
  } catch (err) {
    if (!path.extname(filePath)) {
      if (fs.existsSync(filePath + ".html")) filePath += ".html";
      else if (fs.existsSync(path.join(filePath, "index.html"))) filePath = path.join(filePath, "index.html");
    }
  }

  // Never serve server-side code or local secrets over HTTP.
  const blockedDir = `${path.sep}api${path.sep}`;
  const blockedFile = path.basename(filePath);
  if (
    filePath.includes(blockedDir) ||
    blockedFile.startsWith(".env") ||
    ["package.json", "package-lock.json", "server.js", ".gitignore"].includes(blockedFile)
  ) {
    response.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
    response.end("Not found");
    return;
  }

  fs.stat(filePath, (statError, stats) => {
    if (statError || !stats.isFile()) {
      response.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
      response.end("Not found");
      return;
    }

    const extension = path.extname(filePath).toLowerCase();
    response.writeHead(200, {
      "Content-Type": types[extension] || "application/octet-stream",
      "Cache-Control": extension === ".html" ? "no-cache" : "public, max-age=3600",
      "X-Content-Type-Options": "nosniff"
    });
    fs.createReadStream(filePath).pipe(response);
  });
});

server.listen(port, "127.0.0.1", () => {
  console.log(`VOYD CORP site running at http://127.0.0.1:${port}`);
});
