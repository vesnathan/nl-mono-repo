#!/usr/bin/env node
"use strict";
const fs = require("fs");
const path = require("path");

function copyRecursive(src, dest, ignore = []) {
  if (!fs.existsSync(src)) return;
  const stat = fs.statSync(src);
  if (stat.isDirectory()) {
    if (!fs.existsSync(dest)) fs.mkdirSync(dest, { recursive: true });
    const items = fs.readdirSync(src);
    for (const item of items) {
      if (ignore.includes(item)) continue;
      copyRecursive(path.join(src, item), path.join(dest, item), ignore);
    }
  } else {
    fs.copyFileSync(src, dest);
  }
}

function updatePackageJson(destPackagePath, newName) {
  // Walk the copied tree and update any package.json 'name' fields
  function walkAndUpdate(dir) {
    const items = fs.readdirSync(dir);
    for (const item of items) {
      const full = path.join(dir, item);
      const stat = fs.statSync(full);
      if (stat.isDirectory()) {
        walkAndUpdate(full);
      } else if (item === "package.json") {
        try {
          const pkg = JSON.parse(fs.readFileSync(full, "utf8"));
          // Only update when the name references cloudwatchlive or cwl prefix
          if (pkg && typeof pkg.name === "string") {
            // Replace names that look like cwl* or cloudwatchlive*
            if (/cwl|cloudwatchlive/i.test(pkg.name)) {
              pkg.name = pkg.name
                .replace(/cloudwatchlive/gi, newName)
                .replace(/cwl/gi, newName);
              fs.writeFileSync(full, JSON.stringify(pkg, null, 2) + "\n");
            }
          }
        } catch (e) {
          // ignore parse errors
        }
      }
    }
  }
  walkAndUpdate(destPackagePath);
}

function updateReadme(destPackagePath, newName) {
  const readmePath = path.join(destPackagePath, "README.md");
  if (!fs.existsSync(readmePath)) return;
  let content = fs.readFileSync(readmePath, "utf8");
  content = content.replace(/cloudwatchlive/gi, newName);
  fs.writeFileSync(readmePath, content);
}

function main() {
  const args = process.argv.slice(2);
  if (args.length < 1) {
    console.error("Usage: create-template.js <new-package-name>");
    process.exit(2);
  }
  const newPkg = args[0];
  const root = path.resolve(__dirname, "../../..");
  const src = path.join(root, "packages", "cloudwatchlive");
  const dest = path.join(root, "packages", newPkg);
  if (fs.existsSync(dest)) {
    console.error("Destination already exists:", dest);
    process.exit(3);
  }
  console.log("Copying from", src, "to", dest);
  copyRecursive(src, dest, ["node_modules", ".next"]);
  updatePackageJson(dest, newPkg);
  updateReadme(dest, newPkg);
  console.log("Created package at", dest);
}

main();
