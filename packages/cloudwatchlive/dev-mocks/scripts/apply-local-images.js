// apply-local-images.js
// Rewrites mockEvents.json image fields to point to local /images/<filename>
// Usage: node apply-local-images.js

const fs = require("fs");
const path = require("path");

const repo = path.resolve(__dirname, "..", "..", "..", "..");
const imagesDir = path.join(
  repo,
  "packages",
  "cloudwatchlive",
  "frontend",
  "public",
  "images",
);
const mockPath = path.join(
  repo,
  "packages",
  "cloudwatchlive",
  "dev-mocks",
  "mockEvents.json",
);

function main() {
  console.log("repo root:", repo);
  if (!fs.existsSync(imagesDir)) {
    console.error("Images directory not found:", imagesDir);
    process.exit(2);
  }
  if (!fs.existsSync(mockPath)) {
    console.error("mockEvents.json not found:", mockPath);
    process.exit(3);
  }

  const images = fs
    .readdirSync(imagesDir)
    .filter((f) => /\.(jpe?g|png|svg)$/i.test(f));
  if (!images.length) {
    console.error("No image files found in", imagesDir);
    process.exit(4);
  }
  console.log("found images:", images.length);

  const raw = fs.readFileSync(mockPath, "utf8");
  let data;
  try {
    data = JSON.parse(raw);
  } catch (err) {
    console.error("Failed to parse mockEvents.json:", err.message);
    process.exit(5);
  }

  const backupPath = mockPath + ".bak." + Date.now();
  fs.copyFileSync(mockPath, backupPath);
  console.log("backup written to", backupPath);

  let updated = 0;
  let idx = 0;
  for (const ev of data) {
    const img = String(ev.image || "");
    if (img.startsWith("/images/")) continue;
    const pick = images[idx % images.length];
    ev.image = "/images/" + pick;
    idx++;
    updated++;
  }

  fs.writeFileSync(mockPath, JSON.stringify(data, null, 2), "utf8");
  console.log("mockEvents.json updated, eventsUpdated=", updated);
  console.log("You can inspect the backup at", backupPath);
}

main();
