const fs = require("fs");
const path = require("path");

const seedDataPath = path.join(__dirname, "../data/seed-data.ts");
let content = fs.readFileSync(seedDataPath, "utf8");

// Find all node objects and add createdAt and editableUntil fields
// Pattern: Find nodes that have stats but no createdAt

const lines = content.split("\n");
const newLines = [];
let i = 0;

while (i < lines.length) {
  newLines.push(lines[i]);

  // Check if this line is "parentNodeId: null," or "parentNodeId: NODE_IDS.SOMETHING,"
  if (lines[i].trim().match(/parentNodeId: (null|NODE_IDS\.[A-Z_]+),?$/)) {
    // Check if next line is NOT createdAt
    if (i + 1 < lines.length && !lines[i + 1].trim().startsWith("createdAt:")) {
      // Get the indentation from the current line
      const indent = lines[i].match(/^(\s*)/)[1];

      // Generate a timestamp based on line number for consistency
      const baseDate = new Date("2024-01-15T10:00:00Z");
      const offsetHours = Math.floor(i / 10);
      const createdDate = new Date(
        baseDate.getTime() + offsetHours * 60 * 60 * 1000,
      );
      const editableDate = new Date(
        createdDate.getTime() + 24 * 60 * 60 * 1000,
      );

      // Add the timestamp fields
      newLines.push(`${indent}createdAt: "${createdDate.toISOString()}",`);
      newLines.push(`${indent}editableUntil: "${editableDate.toISOString()}",`);
    }
  }

  i++;
}

const newContent = newLines.join("\n");
fs.writeFileSync(seedDataPath, newContent, "utf8");

console.log("✅ Added createdAt and editableUntil fields to all nodes");
