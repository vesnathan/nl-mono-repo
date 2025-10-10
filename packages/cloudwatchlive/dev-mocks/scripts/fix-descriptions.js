const fs = require("fs");
const path = require("path");
const file = path.resolve(__dirname, "../mockEvents.json");
const raw = fs.readFileSync(file, "utf8");
const arr = JSON.parse(raw);
let changed = 0;

// Common repeated suffix we've seen in the dataset
const repeatedSuffix = "join industry experts for a focused session.";

// A small pool of alternative endings to make shortDescription varied and natural.
const alternatives = [
  "an interactive session with industry leaders.",
  "practical takeaways and real-world use cases.",
  "a hands-on workshop with live Q&A.",
  "expert panels, demos, and networking opportunities.",
  "a focused session featuring actionable insights.",
];

function pick(index) {
  // deterministic pick so rerunning the script is stable: hash the id-ish index
  return alternatives[index % alternatives.length];
}

for (let i = 0; i < arr.length; i++) {
  const e = arr[i];
  if (!e.shortDescription || typeof e.shortDescription !== "string") {
    e.shortDescription = e.title ? `${e.title} — short summary.` : "Event";
    changed++;
  } else {
    // If the shortDescription contains the exact repeated suffix, replace that suffix
    const s = String(e.shortDescription || "");
    if (s.toLowerCase().includes(repeatedSuffix)) {
      const titlePart = e.title ? String(e.title) : "Event";
      const newSuffix = pick(i);
      e.shortDescription = `${titlePart} — ${newSuffix}`;
      changed++;
    }
  }

  if (!e.description || typeof e.description !== "string") {
    e.description = e.shortDescription + " Full description to follow.";
    changed++;
  }
}

if (changed > 0) {
  // backup the original first
  const bak = file + ".bak." + Date.now();
  fs.writeFileSync(bak, raw, "utf8");
  fs.writeFileSync(file, JSON.stringify(arr, null, 2), "utf8");
  console.log(
    "Patched",
    changed,
    "fields in mockEvents.json — backup written to",
    bak,
  );
} else {
  console.log("No changes needed");
}
