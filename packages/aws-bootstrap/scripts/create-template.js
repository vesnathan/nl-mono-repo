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

function replaceInFile(filePath, replacements) {
  try {
    let content = fs.readFileSync(filePath, "utf8");
    let changed = false;
    for (const { from, to, flags } of replacements) {
      const re = new RegExp(from, flags || "g");
      if (re.test(content)) {
        content = content.replace(re, to);
        changed = true;
      }
    }
    if (changed) fs.writeFileSync(filePath, content, "utf8");
  } catch (e) {
    // ignore binary files or read errors
  }
}

function renameFilesWithPatterns(rootDir, patterns) {
  const items = fs.readdirSync(rootDir);
  for (const item of items) {
    const full = path.join(rootDir, item);
    const stat = fs.statSync(full);
    if (stat.isDirectory()) {
      renameFilesWithPatterns(full, patterns);
    }
    let newName = item;
    for (const { from, to, flags } of patterns) {
      const re = new RegExp(from, flags || "g");
      newName = newName.replace(re, to);
    }
    if (newName !== item) {
      const newFull = path.join(rootDir, newName);
      fs.renameSync(full, newFull);
      if (stat.isDirectory()) {
        renameFilesWithPatterns(newFull, patterns);
      }
    } else if (stat.isDirectory()) {
      // descend
      // already handled
    }
  }
}

function updatePackageJsonNames(destPackagePath, newName) {
  function walk(dir) {
    const items = fs.readdirSync(dir);
    for (const item of items) {
      const full = path.join(dir, item);
      const stat = fs.statSync(full);
      if (stat.isDirectory()) walk(full);
      else if (item === "package.json") {
        try {
          const pkg = JSON.parse(fs.readFileSync(full, "utf8"));
          if (pkg && typeof pkg.name === "string") {
            pkg.name = pkg.name
              .replace(/cloudwatchlive/gi, newName)
              .replace(/cwl/gi, "awsb");
            fs.writeFileSync(full, JSON.stringify(pkg, null, 2) + "\n");
          }
        } catch (e) {}
      }
    }
  }
  walk(destPackagePath);
}

function replaceTokensInTree(destPackagePath, newName) {
  // Case-aware replacements: replace CWL/Cwl/cwl to AWSB/Awsb/awsb respectively
  // and cloudwatchlive -> newName (case-insensitive)
  const replacements = [
    { re: /cloudwatchlive/gi, to: newName },
    { re: /CWL/g, to: "AWSB" },
    { re: /Cwl/g, to: "Awsb" },
    { re: /cwl/g, to: "awsb" },
  ];

  function replaceFileTokens(filePath) {
    try {
      let content = fs.readFileSync(filePath, "utf8");
      let changed = false;
      for (const { re, to } of replacements) {
        if (re.test(content)) {
          content = content.replace(re, to);
          changed = true;
        }
      }
      if (changed) fs.writeFileSync(filePath, content, "utf8");
    } catch (e) {
      // skip binary files or read errors
    }
  }

  function walk(dir) {
    const items = fs.readdirSync(dir);
    for (const item of items) {
      const full = path.join(dir, item);
      const stat = fs.statSync(full);
      if (stat.isDirectory()) walk(full);
      else replaceFileTokens(full);
    }
  }

  walk(destPackagePath);
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

  // Rename files that contain cwl or CWL in their filenames to awsb/AWSB
  renameFilesWithPatterns(dest, [
    { from: "cwl", to: "awsb", flags: "gi" },
    { from: "CWL", to: "AWSB", flags: "g" },
  ]);

  // Update package.json name fields
  updatePackageJsonNames(dest, newPkg);

  // Replace tokens inside files
  replaceTokensInTree(dest, newPkg);

  // Add new package workspaces to root package.json (frontend/backend)
  try {
    const rootPkgPath = path.join(root, "package.json");
    if (fs.existsSync(rootPkgPath)) {
      const rootPkg = JSON.parse(fs.readFileSync(rootPkgPath, "utf8"));
      if (!Array.isArray(rootPkg.workspaces))
        rootPkg.workspaces = rootPkg.workspaces || [];
      const frontendEntry = `packages/${newPkg}/frontend`;
      const backendEntry = `packages/${newPkg}/backend`;
      if (!rootPkg.workspaces.includes(frontendEntry))
        rootPkg.workspaces.push(frontendEntry);
      if (!rootPkg.workspaces.includes(backendEntry))
        rootPkg.workspaces.push(backendEntry);
      fs.writeFileSync(rootPkgPath, JSON.stringify(rootPkg, null, 2) + "\n");
      console.log("Added workspace entries to root package.json");
    }
  } catch (e) {
    console.error(
      "Failed to update root package.json workspaces:",
      e && e.message ? e.message : e,
    );
  }

  console.log("Created package at", dest);
}

main();
