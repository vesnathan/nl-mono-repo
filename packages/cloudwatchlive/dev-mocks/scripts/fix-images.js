const fs = require("fs");
const path = require("path");
const file = path.resolve(__dirname, "../mockEvents.json");
const raw = fs.readFileSync(file, "utf8");
const arr = JSON.parse(raw);
let changed = 0;
const path = require('path');
const DEFAULT = '/images/event-placeholder.svg';
const localImagesDir = path.resolve(__dirname, '..', '..', 'frontend', 'public', 'images');
let localImages = [];
try {
  localImages = require('fs').readdirSync(localImagesDir).filter(f => /\.(jpg|jpeg|png|svg)$/i.test(f));
} catch (e) {
  // ignore - leave localImages empty so DEFAULT is used
}
// simple hash function for deterministic selection
function hashCode(str) {
  let h = 0;
  for (let i = 0; i < str.length; i++) {
    h = (h << 5) - h + str.charCodeAt(i);
    h |= 0;
  }
  return h;
}
for (const e of arr) {
  if (!e.image) {
    if (localImages.length > 0) {
      // pick a deterministic file by event id (if present) or index
      const idx = e.id ? Math.abs(hashCode(String(e.id))) % localImages.length : changed % localImages.length;
      e.image = '/images/' + localImages[idx];
    } else {
      e.image = DEFAULT;
    }
    changed++;
  }
}
if (changed > 0) {
  fs.writeFileSync(file, JSON.stringify(arr, null, 2), "utf8");
  console.log("Patched", changed, "image fields in mockEvents.json");
} else {
  console.log("No image changes needed");
}
