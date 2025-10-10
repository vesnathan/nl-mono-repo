#!/usr/bin/env node
/*
Simple image downloader for dev-mocks.

Usage:
  node download-images.js           # dry-run, prints what would be downloaded
  node download-images.js --apply   # download and update mockEvents.json in-place
  node download-images.js --max 20  # limit number of images to download

What it does:
 - Reads mockEvents.json in the same folder
 - Finds events with image fields that are remote (http/https)
 - Downloads them into packages/cloudwatchlive/frontend/public/images/
 - If --apply is provided it will update the image field in mockEvents.json to the local path (/images/<file>)

Notes:
 - The script is intentionally conservative: it won't overwrite existing files and only follows a few redirects.
 - No external dependencies are required; uses Node's https/http modules.
*/

const fs = require("fs");
const path = require("path");
const https = require("https");
const http = require("http");
const { URL } = require("url");

const ROOT = path.resolve(__dirname, "..", "..", "..");
const MOCK_PATH = path.join(__dirname, "..", "mockEvents.json");
const PUBLIC_IMAGES = path.join(
  ROOT,
  "packages",
  "cloudwatchlive",
  "frontend",
  "public",
  "images",
);

const argv = process.argv.slice(2);
const apply = argv.includes("--apply") || argv.includes("-a");
const maxIdx = argv.indexOf("--max");
const max = maxIdx !== -1 ? parseInt(argv[maxIdx + 1], 10) || 50 : 50;

function ensureDir(p) {
  if (!fs.existsSync(p)) fs.mkdirSync(p, { recursive: true });
}

function extFromUrl(url) {
  try {
    const u = new URL(url);
    const pathname = u.pathname;
    const ext = path.extname(pathname).split("?")[0];
    if (ext && ext.length <= 5) return ext;
  } catch (e) {}
  return "";
}

function downloadUrlToFile(url, dest, maxRedirects = 5, timeoutMs = 15000) {
  return new Promise((resolve, reject) => {
    let redirects = 0;
    let timedOut = false;
    const abortAfter = setTimeout(() => {
      timedOut = true;
      reject(new Error("Request timed out"));
    }, timeoutMs);

    function _get(u) {
      if (timedOut) return;
      let parsed;
      try {
        parsed = new URL(u);
      } catch (err) {
        clearTimeout(abortAfter);
        return reject(new Error("Invalid URL: " + u));
      }
      const lib = parsed.protocol === "https:" ? https : http;
      const req = lib.get(parsed, (res) => {
        if (timedOut) return;
        // follow redirects manually but normalize relative redirects
        if (
          res.statusCode >= 300 &&
          res.statusCode < 400 &&
          res.headers.location
        ) {
          if (redirects >= maxRedirects) {
            clearTimeout(abortAfter);
            return reject(new Error("Too many redirects"));
          }
          redirects++;
          const loc = new URL(res.headers.location, parsed).toString();
          return _get(loc);
        }
        if (res.statusCode !== 200) {
          clearTimeout(abortAfter);
          return reject(
            new Error("Failed to download " + u + " - " + res.statusCode),
          );
        }
        const fileStream = fs.createWriteStream(dest);
        res.pipe(fileStream);
        fileStream.on("finish", () => {
          clearTimeout(abortAfter);
          fileStream.close(() => resolve(dest));
        });
        fileStream.on("error", (err) => {
          clearTimeout(abortAfter);
          reject(err);
        });
      });
      req.on("error", (err) => {
        clearTimeout(abortAfter);
        reject(err);
      });
    }
    _get(url);
  });
}

(async function main() {
  ensureDir(PUBLIC_IMAGES);

  if (!fs.existsSync(MOCK_PATH)) {
    console.error("mockEvents.json not found at", MOCK_PATH);
    process.exit(1);
  }

  const raw = fs.readFileSync(MOCK_PATH, "utf8");
  let events;
  try {
    events = JSON.parse(raw);
  } catch (e) {
    console.error("Failed to parse mockEvents.json:", e.message);
    process.exit(1);
  }

  const tasks = [];
  for (const ev of events) {
    const img = ev.image;
    if (!img) continue;
    const s = String(img).trim();
    if (s.startsWith("/") || s.startsWith("data:")) continue; // already local
    if (!/^https?:\/\//i.test(s)) continue; // unknown scheme
    tasks.push({ id: ev.id, url: s });
  }

  if (tasks.length === 0) {
    console.log("No remote images found in mockEvents.json");
    return;
  }

  console.log(`Found ${tasks.length} remote images; will process up to ${max}`);

  const picks = tasks.slice(0, max);
  const changes = [];

  // If not applying, perform a dry-run: list what would be downloaded and exit quickly.
  if (!apply) {
    console.log("\nDry run (no downloads):");
    for (const t of picks) {
      console.log(t.id, "->", t.url);
    }
    console.log(
      "\nDry run complete. Re-run with --apply to actually download and update mockEvents.json",
    );
    return;
  }

  // When applying, download with a small concurrency to avoid long sequential hangs.
  const CONCURRENCY = 6;
  const timeoutMs = 8000;

  async function worker(queue) {
    while (queue.length) {
      const t = queue.shift();
      const url = t.url;
      const extFromPath = extFromUrl(url) || "";
      const ext = extFromPath || ".jpg";
      const filename = `${t.id}${ext}`;
      const dest = path.join(PUBLIC_IMAGES, filename);
      if (fs.existsSync(dest)) {
        console.log("Skip existing", filename);
        changes.push({
          id: t.id,
          url,
          local: `/images/${filename}`,
          skipped: true,
        });
        continue;
      }
      console.log("Downloading", url, "->", filename);
      try {
        await downloadUrlToFile(url, dest, 5, timeoutMs);
        changes.push({
          id: t.id,
          url,
          local: `/images/${filename}`,
          success: true,
        });
      } catch (err) {
        console.error("Failed to download", url, err.message || err);
        changes.push({
          id: t.id,
          url,
          local: null,
          error: String(err.message || err),
        });
      }
    }
  }

  const queue = picks.slice();
  const workers = [];
  for (let i = 0; i < CONCURRENCY; i++) workers.push(worker(queue));
  await Promise.all(workers);

  console.log("\nSummary:");
  for (const c of changes) {
    console.log(c.id, c.local || "FAILED", c.error ? `ERROR: ${c.error}` : "");
  }

  // Update mockEvents.json in-place to point at local images where available
  for (const c of changes) {
    if (c.local) {
      for (const ev of events) {
        if (ev.id === c.id) {
          ev.image = c.local;
          break;
        }
      }
    }
  }
  fs.writeFileSync(MOCK_PATH, JSON.stringify(events, null, 2), "utf8");
  console.log("\nmockEvents.json updated with local image paths.");
})();
