#!/usr/bin/env node
"use strict";
const fs = require("fs");
const path = require("path");
const readline = require("readline");

// Prompt helper for interactive questions
async function prompt(question, defaultValue = "") {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  return new Promise((resolve) => {
    const displayQuestion = defaultValue
      ? `${question} (${defaultValue}): `
      : `${question}: `;
    rl.question(displayQuestion, (answer) => {
      rl.close();
      resolve(answer.trim() || defaultValue);
    });
  });
}

// Validate package name format (kebab-case)
function validatePackageName(name) {
  const kebabCaseRegex = /^[a-z][a-z0-9]*(-[a-z0-9]+)*$/;
  return kebabCaseRegex.test(name);
}

// Validate short name format (lowercase alphanumeric)
function validateShortName(name) {
  const shortNameRegex = /^[a-z][a-z0-9]*$/;
  return shortNameRegex.test(name);
}

function copyRecursive(src, dest, ignore = []) {
  // Use fs-extra's robust copySync if available to preserve dotfiles, symlinks,
  // and file modes. Provide a filter so the ignore array is honored.
  try {
    const fsExtra = require("fs-extra");
    fsExtra.copySync(src, dest, {
      dereference: true,
      preserveTimestamps: true,
      errorOnExist: false,
      recursive: true,
      filter: (srcPath) => {
        // Compute path relative to source root
        const rel = path.relative(src, srcPath);
        if (!rel) return true; // root
        const seg = rel.split(path.sep)[0];
        // If the top-level segment is in the ignore list, skip
        if (ignore.includes(seg)) return false;
        return true;
      },
    });
    return;
  } catch (e) {
    // Fallback to a conservative copy if fs-extra isn't available.
    if (!fs.existsSync(src)) return;
    const stat = fs.statSync(src);
    if (stat.isDirectory()) {
      if (!fs.existsSync(dest)) fs.mkdirSync(dest, { recursive: true });
      const items = fs.readdirSync(src, { withFileTypes: true });
      for (const entry of items) {
        const item = entry.name;
        if (ignore.includes(item)) continue;
        const srcItem = path.join(src, item);
        const destItem = path.join(dest, item);
        if (entry.isDirectory()) {
          copyRecursive(srcItem, destItem, ignore);
        } else if (entry.isSymbolicLink()) {
          try {
            const link = fs.readlinkSync(srcItem);
            fs.symlinkSync(link, destItem);
          } catch (syErr) {
            // fallback to a regular copy
            try {
              fs.copyFileSync(srcItem, destItem);
            } catch (copyErr) {
              // ignore
            }
          }
        } else {
          try {
            fs.copyFileSync(srcItem, destItem);
            const st = fs.statSync(srcItem);
            try {
              fs.chmodSync(destItem, st.mode);
            } catch (chmodErr) {
              // best-effort
            }
          } catch (copyErr) {
            // ignore binary/read errors
          }
        }
      }
    } else {
      fs.copyFileSync(src, dest);
    }
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
      // already handled
    }
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

function replaceTokensInTree(destPackagePath, replacements) {
  function replaceFileTokens(filePath) {
    replaceInFile(filePath, replacements);
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

// Sanitize component files: detect files that look like React components and
// ensure filenames are PascalCase and update import paths inside the new
// package so imports keep working.
function sanitizeComponents(
  destPackagePath,
  longName,
  shortName,
  pascalCaseName,
  capitalizedShortName,
  upperShortName,
) {
  const frontendSrc = path.join(destPackagePath, "frontend", "src");
  if (!fs.existsSync(frontendSrc)) return;

  function toPascalCase(name) {
    // remove extension
    const noExt = name.replace(/\.[^.]+$/, "");
    // split by separators and capitalize parts
    const parts = noExt.split(/[_\-\.]/).filter(Boolean);
    if (parts.length === 0) return name;
    const pascal = parts
      .map((p) => p.charAt(0).toUpperCase() + p.slice(1))
      .join("");
    // preserve extension
    const ext = name.slice(noExt.length);
    return pascal + ext;
  }

  const renamed = {};

  function walkAndRename(dir) {
    const items = fs.readdirSync(dir);
    for (const item of items) {
      const full = path.join(dir, item);
      const stat = fs.statSync(full);
      if (stat.isDirectory()) {
        walkAndRename(full);
        continue;
      }
      // only consider source files
      if (!/\.(tsx|ts|jsx|js)$/.test(item)) continue;
      const content = fs.readFileSync(full, "utf8");
      // Only rename files that contain the old template tokens in the filename
      // to avoid touching hooks or unrelated files. Detect tokens case-insensitively.
      const basename = item.replace(/\.[^.]+$/, "");
      const lower = basename.toLowerCase();
      const tokens = ["aws-example", "aws_example", "awse", "awsexample"];
      const hasToken = tokens.some((t) => lower.includes(t));
      if (!hasToken) continue; // skip files that don't include placeholders

      // Skip hooks: don't rename files that start with 'use' (case-insensitive)
      if (/^use/i.test(basename)) continue;

      // Preserve initial-case of the original filename: if it starts uppercase,
      // use PascalCase/capitalized replacements; otherwise use lowercase/kebab.
      const startsUpper = /^[A-Z]/.test(basename);

      let newName = item;
      // Replace various placeholder forms with the appropriate replacement
      if (startsUpper) {
        // Prefer PascalCase and Capitalized short name
        newName = newName.replace(/AwsExample/gi, pascalCaseName);
        newName = newName.replace(/AWSExample/gi, pascalCaseName);
        newName = newName.replace(/AWSE/gi, capitalizedShortName);
        newName = newName.replace(/Awse/gi, capitalizedShortName);
      } else {
        // Prefer kebab-case longName and shortName for lowercase-starting files
        newName = newName.replace(/aws-example/gi, longName);
        newName = newName.replace(/aws_example/gi, longName);
        newName = newName.replace(/awse/gi, shortName);
      }

      if (newName !== item) {
        const newFull = path.join(dir, newName);
        fs.renameSync(full, newFull);
        const oldBase = basename;
        const newBase = newName.replace(/\.[^.]+$/, "");
        renamed[oldBase] = newBase;
      }
    }
  }

  walkAndRename(frontendSrc);

  // If we renamed files, update import paths within the package
  if (Object.keys(renamed).length === 0) return;

  function replaceImports(dir) {
    const items = fs.readdirSync(dir);
    for (const item of items) {
      const full = path.join(dir, item);
      const stat = fs.statSync(full);
      if (stat.isDirectory()) {
        replaceImports(full);
        continue;
      }
      // only text files
      if (!/\.(tsx|ts|jsx|js|json|md|yml|yaml)$/.test(item)) continue;
      let content = fs.readFileSync(full, "utf8");
      let changed = false;
      for (const [oldBase, newBase] of Object.entries(renamed)) {
        // replace import paths like './oldBase' or '../path/oldBase'
        const re = new RegExp(
          "([\"'])((?:\\.{1,2}\\/)*)(" + oldBase + ")([\"'])",
          "g",
        );
        if (re.test(content)) {
          content = content.replace(
            re,
            (m, q1, prefix, base, q2) => `${q1}${prefix}${newBase}${q2}`,
          );
          changed = true;
        }
        // also replace occurrences ending with extension
        const reExt = new RegExp(
          "([\"'])((?:\\.{1,2}\\/)*)(" + oldBase + ")\\.(tsx|ts|jsx|js)([\"'])",
          "g",
        );
        if (reExt.test(content)) {
          content = content.replace(
            reExt,
            (m, q1, prefix, base, ext, q2) =>
              `${q1}${prefix}${newBase}.${ext}${q2}`,
          );
          changed = true;
        }
        // replace absolute path aliases like '@/path/oldBase' or '~/path/oldBase'
        const reAlias = new RegExp(
          "([\"'])(@|~)(/[^\"']*)(" + oldBase + ")([\"'])",
          "g",
        );
        if (reAlias.test(content)) {
          content = content.replace(
            reAlias,
            (m, q1, alias, prefix, base, q2) =>
              `${q1}${alias}${prefix}${newBase}${q2}`,
          );
          changed = true;
        }
        // replace absolute path aliases ending with extension
        const reAliasExt = new RegExp(
          "([\"'])(@|~)(/[^\"']*)(" + oldBase + ")\\.(tsx|ts|jsx|js)([\"'])",
          "g",
        );
        if (reAliasExt.test(content)) {
          content = content.replace(
            reAliasExt,
            (m, q1, alias, prefix, base, ext, q2) =>
              `${q1}${alias}${prefix}${newBase}.${ext}${q2}`,
          );
          changed = true;
        }
      }
      if (changed) fs.writeFileSync(full, content, "utf8");
    }
  }

  replaceImports(destPackagePath);
}

// Remove a created package and clean workspace/deploy references.
async function removePackageInteractive() {
  const root = path.resolve(__dirname, "../../..");
  // If no package name is provided, present an interactive menu
  async function listPackagesForRemoval() {
    const packagesRoot = path.join(root, "packages");
    if (!fs.existsSync(packagesRoot)) return [];
    const items = fs.readdirSync(packagesRoot).filter((d) => {
      try {
        return fs.statSync(path.join(packagesRoot, d)).isDirectory();
      } catch (e) {
        return false;
      }
    });
    // Exclude internal/protected packages from the default deletion list
    const protectedPackages = new Set([
      "aws-bootstrap",
      "deploy",
      "shared",
      "waf",
      "aws-example", // Template package for cloning
    ]);
    return items.filter((i) => !protectedPackages.has(i));
  }
  // Exclude internal/protected packages from the default deletion list
  // Helper: collect all package.json paths under packages/ (exclude node_modules)
  function collectAllPackageJsons() {
    const base = path.join(root, "packages");
    const results = [];
    function walk(dir) {
      const items = fs.readdirSync(dir, { withFileTypes: true });
      for (const it of items) {
        if (it.name === "node_modules") continue;
        const full = path.join(dir, it.name);
        if (it.isDirectory()) {
          walk(full);
        } else if (it.isFile() && it.name === "package.json") {
          results.push(full);
        }
      }
    }
    if (fs.existsSync(base)) walk(base);
    return results;
  }

  // Helper: get declared package names inside a package folder (may include multiple package.jsons)
  function getLocalPackageNames(longName) {
    const pkgDir = path.join(root, "packages", longName);
    const names = new Set();
    if (!fs.existsSync(pkgDir)) return Array.from(names);
    function walk(dir) {
      const items = fs.readdirSync(dir, { withFileTypes: true });
      for (const it of items) {
        const full = path.join(dir, it.name);
        if (it.isDirectory()) {
          if (it.name === "node_modules") continue;
          walk(full);
        } else if (it.isFile() && it.name === "package.json") {
          try {
            const pkg = JSON.parse(fs.readFileSync(full, "utf8"));
            if (pkg && pkg.name) names.add(pkg.name);
          } catch (e) {
            // ignore
          }
        }
      }
    }
    walk(pkgDir);
    return Array.from(names);
  }

  // Helper: find packages that depend on any of the given package names
  function findDependents(targetNames, excludeLongName) {
    const dependents = [];
    const allPkgJsons = collectAllPackageJsons();
    for (const pj of allPkgJsons) {
      // skip package.json files that live under the target package directory
      if (
        excludeLongName &&
        pj.indexOf(path.join("packages", excludeLongName)) !== -1
      )
        continue;
      try {
        const content = JSON.parse(fs.readFileSync(pj, "utf8"));
        const deps = Object.assign(
          {},
          content.dependencies || {},
          content.devDependencies || {},
          content.peerDependencies || {},
          content.optionalDependencies || {},
        );
        const matched = [];
        for (const tn of targetNames) {
          if (deps && Object.prototype.hasOwnProperty.call(deps, tn))
            matched.push(tn);
        }
        if (matched.length > 0) {
          // derive a user-friendly name for the dependent package
          const dependentPkgName =
            content.name || path.basename(path.dirname(pj));
          dependents.push({
            packageJson: pj,
            packageName: dependentPkgName,
            matches: matched,
          });
        }
      } catch (e) {
        // ignore parse errors
      }
    }
    return dependents;
  }

  // Helper: derive top-level package long name from a package.json path
  function getLongNameFromPackageJsonPath(pkgJsonPath) {
    // Expect .../packages/<longName>/.../package.json
    const rel = path.relative(root, path.dirname(pkgJsonPath));
    const parts = rel.split(path.sep);
    const idx = parts.indexOf("packages");
    if (idx === -1) {
      // fallback: first segment
      return parts[0] || null;
    }
    return parts[idx + 1] || null;
  }

  // Helper: detect if a package appears to be "deployed".
  // We treat a package as deployed if there are deploy templates for it
  // under packages/deploy/templates/<longName> or if project-config.ts references it.
  function isPackageDeployed(longName) {
    if (!longName) return false;
    const templatesDir = path.join(
      root,
      "packages",
      "deploy",
      "templates",
      longName,
    );
    if (fs.existsSync(templatesDir)) return true;
    // Also check project-config.ts for templateDir or packageDir entries
    try {
      const projConfigPath = path.join(
        root,
        "packages",
        "deploy",
        "project-config.ts",
      );
      if (!fs.existsSync(projConfigPath)) return false;
      const content = fs.readFileSync(projConfigPath, "utf8");
      if (
        content.includes(`templateDir: "${longName}"`) ||
        content.includes(`packageDir: "${longName}"`) ||
        content.includes(`templates/${longName}/`)
      ) {
        return true;
      }
    } catch (e) {
      // ignore
    }
    return false;
  }

  // If a package name was provided as a CLI arg (e.g. when calling
  // `node ... delete <pkg>`), use that. Otherwise directly present the
  // interactive list so users don't have to type Enter first.
  let longName = process.argv[3] && process.argv[3].toLowerCase();
  if (!longName) {
    const choices = await listPackagesForRemoval();
    if (!choices || choices.length === 0) {
      console.log(
        "No removable packages found under packages/ (none or only protected packages).\nCancelled.",
      );
      return;
    }

    // Build interactive list with disabled flags for packages required by deployed packages
    const items = [];
    for (const pkgName of choices) {
      const localNames = getLocalPackageNames(pkgName);
      const dependents = findDependents(localNames, pkgName) || [];
      const deployedDependents = dependents.filter((d) => {
        const dependentLongName = getLongNameFromPackageJsonPath(d.packageJson);
        return isPackageDeployed(dependentLongName);
      });
      if (deployedDependents.length > 0) {
        items.push({
          label: pkgName,
          disabled: true,
          reason: deployedDependents.map((d) => d.packageName).join(", "),
        });
      } else {
        items.push({ label: pkgName, disabled: false });
      }
    }

    async function interactiveSelectWithDisabled(
      question,
      items,
      defaultIndex = 0,
    ) {
      // Non-interactive fallback
      if (!process.stdin.isTTY) {
        console.log(`\n${question}`);
        items.forEach((it, idx) => {
          const suffix = it.disabled ? ` (blocked by ${it.reason})` : "";
          console.log(`  ${idx + 1}) ${it.label}${suffix}`);
        });
        while (true) {
          const pick = await prompt(
            `Enter number to delete or type package name (or empty to cancel)`,
            String(defaultIndex + 1),
          );
          if (!pick) return null;
          const pickNum = parseInt(pick, 10);
          if (!isNaN(pickNum) && pickNum >= 1 && pickNum <= items.length) {
            const selected = items[pickNum - 1];
            if (selected.disabled) {
              console.log(
                `Cannot delete ${selected.label}: blocked by deployed package(s): ${selected.reason}`,
              );
              continue;
            }
            return selected.label;
          }
          // typed name
          const typed = pick.trim();
          const found = items.find((it) => it.label === typed);
          if (found) {
            if (found.disabled) {
              console.log(
                `Cannot delete ${found.label}: blocked by deployed package(s): ${found.reason}`,
              );
              continue;
            }
            return found.label;
          }
          console.log("Invalid selection, try again.");
        }
      }

      return new Promise((resolve) => {
        const stdout = process.stdout;
        let selected = defaultIndex;
        // ensure default isn't disabled
        if (items[selected] && items[selected].disabled) {
          // find first non-disabled
          const idx = items.findIndex((it) => !it.disabled);
          selected = idx >= 0 ? idx : defaultIndex;
        }

        const title = question;
        const render = (first) => {
          if (!first) stdout.write(`\x1b[${items.length + 1}A`);
          stdout.write("\x1b[0J");
          stdout.write(`\n${title}\n`);
          items.forEach((it, i) => {
            const label = it.disabled
              ? `${it.label} (blocked by ${it.reason})`
              : it.label;
            if (i === selected) {
              if (it.disabled)
                stdout.write(`\x1b[7m\x1b[2m  ${label}  \x1b[0m\n`); // inverse + dim
              else stdout.write(`\x1b[7m  ${label}  \x1b[0m\n`); // inverse
            } else {
              if (it.disabled)
                stdout.write(`\x1b[2m   ${label}\x1b[0m\n`); // dim
              else stdout.write(`   ${label}\n`);
            }
          });
        };

        render(true);

        const onKey = (str, key) => {
          if (key && key.name === "up") {
            // move up skipping disabled
            let i = selected;
            do {
              i = (i - 1 + items.length) % items.length;
            } while (items[i].disabled && i !== selected);
            selected = i;
            render(false);
            return;
          }
          if (key && key.name === "down") {
            let i = selected;
            do {
              i = (i + 1) % items.length;
            } while (items[i].disabled && i !== selected);
            selected = i;
            render(false);
            return;
          }
          if (key && (key.name === "return" || key.name === "enter")) {
            const it = items[selected];
            if (it.disabled) {
              // beep and stay
              stdout.write("\x07");
              return;
            }
            cleanup();
            stdout.write("\n");
            resolve(it.label);
            return;
          }
          if (key && key.ctrl && key.name === "c") {
            cleanup();
            process.exit();
          }
        };

        function cleanup() {
          try {
            process.stdin.removeListener("keypress", onKey);
            process.stdin.setRawMode(false);
          } catch (e) {}
        }

        readline.emitKeypressEvents(process.stdin);
        process.stdin.setRawMode(true);
        process.stdin.on("keypress", onKey);
      });
    }

    const pickLabel = await interactiveSelectWithDisabled(
      "Available packages to remove (use ↑/↓, Enter to choose):",
      items,
      0,
    );
    if (!pickLabel) {
      console.log("Cancelled.");
      return;
    }
    longName = pickLabel;
  }
  const dest = path.join(root, "packages", longName);
  if (!fs.existsSync(dest)) {
    console.error("Package not found:", dest);
    return;
  }

  // Prevent deleting if this package is required by other deployed packages
  try {
    const localNames = getLocalPackageNames(longName);
    const dependents = findDependents(localNames, longName);
    // Filter dependents to those which are deployed
    const deployedDependents = dependents.filter((d) => {
      const dependentLongName = getLongNameFromPackageJsonPath(d.packageJson);
      return isPackageDeployed(dependentLongName);
    });
    if (deployedDependents.length > 0) {
      console.error(
        "Cannot delete package because the following deployed packages depend on it:",
      );
      deployedDependents.forEach((d) =>
        console.error(`  - ${d.packageName} (matches: ${d.matches.join(",")})`),
      );
      console.error(
        "Remove or undeploy those packages first, then retry deletion.",
      );
      return;
    }
  } catch (e) {
    // if our checks fail, be conservative and continue (or optionally block) — opt to continue
  }
  const confirm = await prompt(
    `Permanently delete ${longName}? This will remove files and update workspace/deploy. (yes/no)`,
    "no",
  );
  // corrected prompt call
  // const confirm = await prompt(...)

  if (confirm.toLowerCase() !== "yes" && confirm.toLowerCase() !== "y") {
    console.log("Aborted by user.");
    return;
  }
  // Delete package files
  try {
    fs.rmSync(dest, { recursive: true, force: true });
    console.log(`Deleted package directory ${dest}`);
  } catch (e) {
    console.error(`Failed to delete package directory ${dest}:`, e.message);
  }

  // Also remove deploy templates for this package if present
  try {
    const templatesDir = path.join(
      root,
      "packages",
      "deploy",
      "templates",
      longName,
    );
    if (fs.existsSync(templatesDir)) {
      fs.rmSync(templatesDir, { recursive: true, force: true });
      console.log(`Deleted deploy templates directory ${templatesDir}`);
    }
  } catch (e) {
    console.error(
      `Failed to delete deploy templates directory for ${longName}:`,
      e.message,
    );
  }

  // Remove workspace entries and dev scripts from root package.json
  try {
    const rootPkgPath = path.join(root, "package.json");
    if (fs.existsSync(rootPkgPath)) {
      const rootPkg = JSON.parse(fs.readFileSync(rootPkgPath, "utf8"));
      const frontendEntry = `packages/${longName}/frontend`;
      const backendEntry = `packages/${longName}/backend`;
      if (Array.isArray(rootPkg.workspaces)) {
        // Remove any workspace entries that reference this package directory (robust to variants)
        rootPkg.workspaces = rootPkg.workspaces.filter((w) => {
          if (typeof w !== "string") return true;
          const normalized = w.replace(/\\\\/g, "/");
          if (normalized.includes(`packages/${longName}/`)) return false;
          // exact matches for older style
          if (w === frontendEntry || w === backendEntry) return false;
          return true;
        });
      }
      // Remove dev script for this package (e.g., "dev:awse", "dev:da")
      if (rootPkg.scripts && typeof rootPkg.scripts === "object") {
        const devScriptName = `dev:${shortName}`;
        if (rootPkg.scripts[devScriptName]) {
          delete rootPkg.scripts[devScriptName];
          console.log(`   Removed script: ${devScriptName}`);
        }
      }
      fs.writeFileSync(rootPkgPath, JSON.stringify(rootPkg, null, 2) + "\n");
      console.log("Updated root package.json workspaces and scripts");
    }
  } catch (e) {
    console.error("Failed to update root package.json:", e.message);
  }

  // Remove deploy/types.ts entries for this stack (best-effort)
  try {
    const deployTypesPath = path.join(root, "packages", "deploy", "types.ts");
    if (fs.existsSync(deployTypesPath)) {
      let content = fs.readFileSync(deployTypesPath, "utf8");
      // Derive PascalCase from longName
      const pascalCaseName = longName
        .split("-")
        .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
        .join("");
      // Remove enum line
      content = content.replace(
        new RegExp(`\\s*${pascalCaseName} = "${pascalCaseName}",?\\n`, "g"),
        "",
      );
      // Remove StackType.<PascalCaseName> from STACK_ORDER
      content = content.replace(
        new RegExp(`,?\\s*StackType\\.${pascalCaseName}\\,?\\n`, "g"),
        "\n",
      );
      // Remove template path entries (match possibly multi-line join(...) expressions)
      content = content.replace(
        new RegExp(
          `\\s*\\[StackType\\.${pascalCaseName}\\]:[\\s\\S]*?(?:,\\n|\\n)`,
          "g",
        ),
        "",
      );
      fs.writeFileSync(deployTypesPath, content, "utf8");
      console.log("Updated deploy/types.ts (best-effort)");
    }
  } catch (e) {
    console.error("Failed to update deploy/types.ts:", e.message);
  }

  // Remove deploy/project-config.ts entries for this stack (best-effort)
  try {
    const projectConfigPath = path.join(
      root,
      "packages",
      "deploy",
      "project-config.ts",
    );
    if (fs.existsSync(projectConfigPath)) {
      let content = fs.readFileSync(projectConfigPath, "utf8");
      const pascalCaseName = longName
        .split("-")
        .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
        .join("");
      // Helper: run yarn at repo root to refresh workspaces and lockfile (best-effort)
      async function runYarnAtRoot() {
        try {
          const { execSync } = require("child_process");
          console.log(
            "\n🔁 Running `yarn` at repo root to refresh workspaces...",
          );
          execSync("yarn install --check-files", {
            stdio: "inherit",
            cwd: path.resolve(__dirname, "../../.."),
          });
          console.log("✅ yarn completed");
        } catch (err) {
          console.warn(
            "⚠️  Running yarn failed (non-fatal):",
            err && err.message ? err.message : err,
          );
          console.log(
            "   You may need to run `yarn` manually to update workspaces and lockfile.",
          );
        }
      }
      // Auto-install is handled at the top-level main() via shouldAutoinstall flag.

      // Remove the entire project config entry (multi-line)
      // Match from [StackType.X]: { through the closing },
      content = content.replace(
        new RegExp(
          `\\s*\\[StackType\\.${pascalCaseName}\\]:\\s*\\{[\\s\\S]*?\\},?\\n`,
          "g",
        ),
        "",
      );

      fs.writeFileSync(projectConfigPath, content, "utf8");
      console.log("Updated deploy/project-config.ts (best-effort)");
    }
  } catch (e) {
    console.error("Failed to update deploy/project-config.ts:", e.message);
  }

  console.log("Cleanup complete.");
}

// Non-interactive force delete: remove package and cleanup without prompting
function removePackageForce(longName) {
  const root = path.resolve(__dirname, "../../..");
  if (!longName) {
    console.error("No package name provided to --force-delete");
    return;
  }
  // Prevent force-delete if other deployed packages depend on this package
  try {
    const localNames = getLocalPackageNames(longName);
    const dependents = findDependents(localNames, longName);
    const deployedDependents = dependents.filter((d) => {
      const dependentLongName = getLongNameFromPackageJsonPath(d.packageJson);
      return isPackageDeployed(dependentLongName);
    });
    if (deployedDependents.length > 0) {
      console.error(
        "Refusing to delete package: the following deployed packages depend on it:",
      );
      deployedDependents.forEach((d) =>
        console.error(`  - ${d.packageName} (matches: ${d.matches.join(",")})`),
      );
      console.error(
        "Undeploy or remove those packages first, or run the operation in your CI after confirming it's safe.",
      );
      return;
    }
  } catch (e) {
    // ignore check errors and proceed with caution
  }
  const dest = path.join(root, "packages", longName);
  if (!fs.existsSync(dest)) {
    console.warn(`Package not found (nothing to delete): ${dest}`);
    // Continue to attempt cleanup of workspaces/types just in case
  } else {
    try {
      fs.rmSync(dest, { recursive: true, force: true });
      console.log(`Deleted package directory ${dest}`);
    } catch (e) {
      console.error(`Failed to delete package directory ${dest}:`, e.message);
    }
  }

  // Also remove deploy templates for this package if present
  try {
    const templatesDir = path.join(
      root,
      "packages",
      "deploy",
      "templates",
      longName,
    );
    if (fs.existsSync(templatesDir)) {
      fs.rmSync(templatesDir, { recursive: true, force: true });
      console.log(`Deleted deploy templates directory ${templatesDir}`);
    }
  } catch (e) {
    console.error(
      `Failed to delete deploy templates directory for ${longName}:`,
      e.message,
    );
  }

  // Remove workspace entries and dev scripts from root package.json (robust)
  try {
    const rootPkgPath = path.join(root, "package.json");
    if (fs.existsSync(rootPkgPath)) {
      const rootPkg = JSON.parse(fs.readFileSync(rootPkgPath, "utf8"));
      if (Array.isArray(rootPkg.workspaces)) {
        rootPkg.workspaces = rootPkg.workspaces.filter((w) => {
          if (typeof w !== "string") return true;
          const normalized = w.replace(/\\\\/g, "/");
          if (normalized.includes(`packages/${longName}/`)) return false;
          return true;
        });
      }
      // Remove dev script for this package (e.g., "dev:awse", "dev:da")
      if (rootPkg.scripts && typeof rootPkg.scripts === "object") {
        const devScriptName = `dev:${shortName}`;
        if (rootPkg.scripts[devScriptName]) {
          delete rootPkg.scripts[devScriptName];
          console.log(`   Removed script: ${devScriptName}`);
        }
      }
      fs.writeFileSync(rootPkgPath, JSON.stringify(rootPkg, null, 2) + "\n");
      console.log(
        "Updated root package.json workspaces and scripts (force-delete)",
      );
    }
  } catch (e) {
    console.error("Failed to update root package.json:", e.message);
  }

  // Best-effort remove entries from deploy/types.ts
  try {
    const deployTypesPath = path.join(root, "packages", "deploy", "types.ts");
    if (fs.existsSync(deployTypesPath)) {
      let content = fs.readFileSync(deployTypesPath, "utf8");
      const pascalCaseName = longName
        .split("-")
        .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
        .join("");
      // Remove enum line matching the exact enum entry
      content = content.replace(
        new RegExp(`\\s*${pascalCaseName} = "${pascalCaseName}",?\\n`, "g"),
        "",
      );
      // Remove StackType.<PascalCaseName> from STACK_ORDER
      content = content.replace(
        new RegExp(`,?\\s*StackType\\.${pascalCaseName}\\,?\\n`, "g"),
        "\\n",
      );
      // Remove template path entries (match possibly multi-line join(...) expressions)
      content = content.replace(
        new RegExp(
          `\\s*\\[StackType\\.${pascalCaseName}\\]:[\\s\\S]*?(?:,\\n|\\n)`,
          "g",
        ),
        "",
      );
      fs.writeFileSync(deployTypesPath, content, "utf8");
      console.log("Updated deploy/types.ts (force-delete)");
    }
  } catch (e) {
    console.error("Failed to update deploy/types.ts:", e.message);
  }

  // Best-effort remove entries from deploy/project-config.ts
  try {
    const projectConfigPath = path.join(
      root,
      "packages",
      "deploy",
      "project-config.ts",
    );
    if (fs.existsSync(projectConfigPath)) {
      let content = fs.readFileSync(projectConfigPath, "utf8");
      const pascalCaseName = longName
        .split("-")
        .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
        .join("");

      // Remove the entire project config entry (multi-line)
      content = content.replace(
        new RegExp(
          `\\s*\\[StackType\\.${pascalCaseName}\\]:\\s*\\{[\\s\\S]*?\\},?\\n`,
          "g",
        ),
        "",
      );

      fs.writeFileSync(projectConfigPath, content, "utf8");
      console.log("Updated deploy/project-config.ts (force-delete)");
    }
  } catch (e) {
    console.error("Failed to update deploy/project-config.ts:", e.message);
  }

  console.log(`Force-delete cleanup for ${longName} finished.`);
  // Run yarn at repo root to refresh workspaces and lockfile (best-effort)
  try {
    const { execSync } = require("child_process");
    console.log("\n🔁 Running `yarn` at repo root to refresh workspaces...");
    execSync("yarn install --check-files", {
      stdio: "inherit",
      cwd: path.resolve(__dirname, "../../.."),
    });
    console.log("✅ yarn completed");
  } catch (err) {
    console.warn(
      "⚠️  Running yarn failed (non-fatal):",
      err && err.message ? err.message : err,
    );
    console.log(
      "   You may need to run `yarn` manually to update workspaces and lockfile.",
    );
  }
}

function updatePackageJsonNames(destPackagePath, longName, shortName) {
  function walk(dir) {
    const items = fs.readdirSync(dir);
    for (const item of items) {
      const full = path.join(dir, item);
      const stat = fs.statSync(full);
      if (stat.isDirectory()) walk(full);
      else if (item === "package.json") {
        try {
          const pkg = JSON.parse(fs.readFileSync(full, "utf8"));
          let modified = false;

          if (pkg && typeof pkg.name === "string") {
            // Replace common placeholders in package name
            const newName = pkg.name
              .replace(/aws-example/gi, longName)
              .replace(/aws_example/gi, longName)
              .replace(/awse/gi, shortName);
            if (newName !== pkg.name) {
              pkg.name = newName;
              modified = true;
            }
          }

          // Replace dependency names (workspace dependencies like awsebackend -> {shortName}backend)
          const depTypes = [
            "dependencies",
            "devDependencies",
            "peerDependencies",
            "optionalDependencies",
          ];
          for (const depType of depTypes) {
            if (pkg[depType] && typeof pkg[depType] === "object") {
              const deps = pkg[depType];
              const oldKeys = Object.keys(deps);
              for (const oldKey of oldKeys) {
                const newKey = oldKey
                  .replace(/aws-example/gi, longName)
                  .replace(/aws_example/gi, longName)
                  .replace(/awse/gi, shortName);
                if (newKey !== oldKey) {
                  deps[newKey] = deps[oldKey];
                  delete deps[oldKey];
                  modified = true;
                }
              }
            }
          }

          if (modified) {
            fs.writeFileSync(full, JSON.stringify(pkg, null, 2) + "\n");
          }
        } catch (e) {
          console.error(`Error updating ${full}:`, e.message);
        }
      }
    }
  }
  walk(destPackagePath);
}

async function main() {
  // Parse CLI arg if provided
  let rawArg = process.argv[2] && process.argv[2].toLowerCase();
  // Autoinstall behavior: run `yarn install` after create/delete by default.
  // Users can opt out with --no-autoinstall
  const shouldAutoinstall = !process.argv.includes("--no-autoinstall");
  // Support quick non-interactive listing of removable packages
  if (
    process.argv.includes("--list-removable") ||
    process.argv.includes("--list-removable-json")
  ) {
    const jsonOut = process.argv.includes("--list-removable-json");
    const root = path.resolve(__dirname, "../../..");
    const packagesRoot = path.join(root, "packages");
    function collectTopLevelPackageDirs() {
      if (!fs.existsSync(packagesRoot)) return [];
      return fs.readdirSync(packagesRoot).filter((d) => {
        try {
          return fs.statSync(path.join(packagesRoot, d)).isDirectory();
        } catch (e) {
          return false;
        }
      });
    }

    function getLocalPackageNames(longName) {
      const pkgDir = path.join(root, "packages", longName);
      const names = new Set();
      if (!fs.existsSync(pkgDir)) return Array.from(names);
      function walk(dir) {
        const items = fs.readdirSync(dir, { withFileTypes: true });
        for (const it of items) {
          const full = path.join(dir, it.name);
          if (it.isDirectory()) {
            if (it.name === "node_modules") continue;
            walk(full);
          } else if (it.isFile() && it.name === "package.json") {
            try {
              const pkg = JSON.parse(fs.readFileSync(full, "utf8"));
              if (pkg && pkg.name) names.add(pkg.name);
            } catch (e) {
              // ignore
            }
          }
        }
      }
      walk(pkgDir);
      return Array.from(names);
    }

    function collectAllPackageJsons() {
      const base = path.join(root, "packages");
      const results = [];
      function walk(dir) {
        const items = fs.readdirSync(dir, { withFileTypes: true });
        for (const it of items) {
          if (it.name === "node_modules") continue;
          const full = path.join(dir, it.name);
          if (it.isDirectory()) {
            walk(full);
          } else if (it.isFile() && it.name === "package.json") {
            results.push(full);
          }
        }
      }
      if (fs.existsSync(base)) walk(base);
      return results;
    }

    function findDependents(targetNames, excludeLongName) {
      const dependents = [];
      const allPkgJsons = collectAllPackageJsons();
      for (const pj of allPkgJsons) {
        if (
          excludeLongName &&
          pj.indexOf(path.join("packages", excludeLongName)) !== -1
        )
          continue;
        try {
          const content = JSON.parse(fs.readFileSync(pj, "utf8"));
          const deps = Object.assign(
            {},
            content.dependencies || {},
            content.devDependencies || {},
            content.peerDependencies || {},
            content.optionalDependencies || {},
          );
          const matched = [];
          for (const tn of targetNames) {
            if (deps && Object.prototype.hasOwnProperty.call(deps, tn))
              matched.push(tn);
          }
          if (matched.length > 0) {
            const dependentPkgName =
              content.name || path.basename(path.dirname(pj));
            dependents.push({
              packageJson: pj,
              packageName: dependentPkgName,
              matches: matched,
            });
          }
        } catch (e) {
          // ignore
        }
      }
      return dependents;
    }

    function getLongNameFromPackageJsonPath(pkgJsonPath) {
      const rel = path.relative(root, path.dirname(pkgJsonPath));
      const parts = rel.split(path.sep);
      const idx = parts.indexOf("packages");
      if (idx === -1) return parts[0] || null;
      return parts[idx + 1] || null;
    }

    function isPackageDeployed(longName) {
      if (!longName) return false;
      const templatesDir = path.join(
        root,
        "packages",
        "deploy",
        "templates",
        longName,
      );
      if (fs.existsSync(templatesDir)) return true;
      try {
        const projConfigPath = path.join(
          root,
          "packages",
          "deploy",
          "project-config.ts",
        );
        if (!fs.existsSync(projConfigPath)) return false;
        const content = fs.readFileSync(projConfigPath, "utf8");
        if (
          content.includes(`templateDir: "${longName}"`) ||
          content.includes(`packageDir: "${longName}"`) ||
          content.includes(`templates/${longName}/`)
        ) {
          return true;
        }
      } catch (e) {
        // ignore
      }
      return false;
    }

    const protectedPackages = new Set([
      "aws-bootstrap",
      "deploy",
      "shared",
      "waf",
      "aws-example", // Template package for cloning
    ]);
    const choices = (function () {
      const packagesRoot = path.join(root, "packages");
      if (!fs.existsSync(packagesRoot)) return [];
      return fs
        .readdirSync(packagesRoot)
        .filter((d) => {
          try {
            return fs.statSync(path.join(packagesRoot, d)).isDirectory();
          } catch (e) {
            return false;
          }
        })
        .filter((i) => !protectedPackages.has(i));
    })();

    const items = [];
    for (const pkgName of choices) {
      const localNames = getLocalPackageNames(pkgName);
      const dependents = findDependents(localNames, pkgName) || [];
      const deployedDependents = dependents.filter((d) => {
        const dependentLongName = getLongNameFromPackageJsonPath(d.packageJson);
        return isPackageDeployed(dependentLongName);
      });
      if (deployedDependents.length > 0) {
        items.push({
          label: pkgName,
          disabled: true,
          reason: deployedDependents.map((d) => d.packageName).join(", "),
        });
      } else {
        items.push({ label: pkgName, disabled: false });
      }
    }

    if (jsonOut) {
      console.log(JSON.stringify(items, null, 2));
    } else {
      // plain list: only print labels
      items.forEach((it) => console.log(it.label));
    }
    return;
  }
  // If no argument provided, show an interactive select menu (arrow keys + Enter)
  if (!rawArg) {
    async function selectMenu(question, options, defaultIndex = 0) {
      // Fallback for non-interactive environments
      if (!process.stdin.isTTY) {
        console.log(`\n${question}`);
        options.forEach((o, i) => console.log(`  ${i + 1}) ${o}`));
        const pick = await prompt(
          `Enter number (1-${options.length})`,
          String(defaultIndex + 1),
        );
        const idx = parseInt(pick, 10) - 1;
        return options[
          Math.max(
            0,
            Math.min(options.length - 1, isNaN(idx) ? defaultIndex : idx),
          )
        ];
      }

      return new Promise((resolve) => {
        const stdout = process.stdout;
        let selected = defaultIndex;
        const title = question;
        const render = (first) => {
          if (!first) {
            // move cursor up to redraw
            stdout.write(`\x1b[${options.length + 1}A`);
          }
          // clear lines and re-render
          stdout.write("\x1b[0J");
          stdout.write(`\n${title}\n`);
          options.forEach((opt, i) => {
            if (i === selected)
              stdout.write(`\x1b[7m  ${opt}  \x1b[0m\n`); // inverse
            else stdout.write(`   ${opt}\n`);
          });
        };

        // initial render
        render(true);

        const onKey = (str, key) => {
          if (key && key.name === "up") {
            selected = (selected - 1 + options.length) % options.length;
            render(false);
            return;
          }
          if (key && key.name === "down") {
            selected = (selected + 1) % options.length;
            render(false);
            return;
          }
          if (key && (key.name === "return" || key.name === "enter")) {
            cleanup();
            // move cursor to end after selection
            stdout.write("\n");
            resolve(options[selected]);
            return;
          }
          if (key && key.ctrl && key.name === "c") {
            cleanup();
            process.exit();
          }
        };

        function cleanup() {
          try {
            process.stdin.removeListener("keypress", onKey);
            process.stdin.setRawMode(false);
          } catch (e) {
            // noop
          }
        }

        readline.emitKeypressEvents(process.stdin);
        process.stdin.setRawMode(true);
        process.stdin.on("keypress", onKey);
      });
    }

    const choice = await selectMenu(
      "Select action:",
      ["Create a package", "Delete a package"],
      0,
    );
    if (/^delete/i.test(choice)) rawArg = "delete";
    else rawArg = "create";
  }
  // Support --force-delete <package> (non-interactive) and 'delete' (interactive)
  if (rawArg === "delete" || rawArg === "remove") {
    await removePackageInteractive();
    if (shouldAutoinstall) {
      // ensure the installed state is refreshed after deletion
      try {
        const { execSync } = require("child_process");
        console.log(
          "\n🔁 Running `yarn` at repo root to refresh workspaces...",
        );
        execSync("yarn install --check-files", {
          stdio: "inherit",
          cwd: path.resolve(__dirname, "../../.."),
        });
        console.log("✅ yarn completed");
      } catch (err) {
        console.warn(
          "⚠️  Running yarn failed (non-fatal):",
          err && err.message ? err.message : err,
        );
        console.log(
          "   You may need to run `yarn` manually to update workspaces and lockfile.",
        );
      }
    }
    return;
  }
  if (rawArg === "--force-delete" || rawArg === "force-delete") {
    const pkg = process.argv[3];
    const confirmFlag = process.argv.includes("--confirm");
    if (!pkg) {
      console.error("Usage: --force-delete <package-name> [--confirm]");
      process.exit(1);
    }
    if (!confirmFlag) {
      console.log(
        `Dry-run: --force-delete ${pkg} (no --confirm provided). No changes made.`,
      );
      console.log(
        `To actually delete, run: node packages/aws-bootstrap/scripts/aws-package-manager.js --force-delete ${pkg} --confirm`,
      );
      process.exit(0);
    }
    // proceed with destructive action
    removePackageForce(pkg);
    if (shouldAutoinstall) {
      try {
        const { execSync } = require("child_process");
        console.log(
          "\n🔁 Running `yarn` at repo root to refresh workspaces...",
        );
        execSync("yarn install --check-files", {
          stdio: "inherit",
          cwd: path.resolve(__dirname, "../../.."),
        });
        console.log("✅ yarn completed");
      } catch (err) {
        console.warn(
          "⚠️  Running yarn failed (non-fatal):",
          err && err.message ? err.message : err,
        );
        console.log(
          "   You may need to run `yarn` manually to update workspaces and lockfile.",
        );
      }
    }
    return;
  }
  console.log("\n===========================================");
  console.log("AWS Package Bootstrap Tool");
  console.log("===========================================\n");
  console.log(
    "This tool will create a new AWS package by cloning aws-example.",
  );
  console.log("You'll need to provide:\n");
  console.log("  1. Project title (e.g., 'My Awesome App')");
  console.log("  2. Package long name (e.g., 'my-awesome-app')");
  console.log("  3. Package short name (e.g., 'maa')\n");

  // Get project title
  let projectTitle = "";
  while (!projectTitle) {
    projectTitle = await prompt(
      "Enter the project title (e.g., 'My Awesome App')",
    );
    if (!projectTitle.trim()) {
      console.error("❌ Project title cannot be empty.");
      projectTitle = "";
    }
  }

  // Get package long name
  let longName = "";
  const defaultLongName = projectTitle
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  while (!longName) {
    longName = await prompt(
      "Enter the package long name (kebab-case, e.g., 'my-awesome-app')",
      defaultLongName,
    );
    if (!validatePackageName(longName)) {
      console.error(
        "❌ Invalid package name. Must be kebab-case (lowercase letters, numbers, and hyphens only).",
      );
      longName = "";
    }
  }

  // Get package short name
  let shortName = "";
  while (!shortName) {
    const defaultShortName = longName
      .split("-")
      .map((part) => part[0])
      .join("")
      .substring(0, 6);
    shortName = await prompt(
      `Enter the package short name (lowercase alphanumeric, e.g., '${defaultShortName}')`,
      defaultShortName,
    );
    if (!validateShortName(shortName)) {
      console.error(
        "❌ Invalid short name. Must be lowercase alphanumeric only.",
      );
      shortName = "";
    }
  }

  const upperShortName = shortName.toUpperCase();

  // Convert longName (kebab-case) to PascalCase for StackType enum
  // e.g., "my-awesome-app" -> "MyAwesomeApp"
  const pascalCaseName = longName
    .split("-")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join("");

  // Generate camelCase version for variables
  const camelCaseName = longName
    .split("-")
    .map((word, i) =>
      i === 0 ? word : word.charAt(0).toUpperCase() + word.slice(1),
    )
    .join("");

  // Capitalized short name (e.g., "maa" -> "Maa")
  const capitalizedShortName =
    shortName.charAt(0).toUpperCase() + shortName.slice(1);

  // Optional: Ask for description
  const description = await prompt(
    "Enter a brief description (optional)",
    `${projectTitle} package`,
  );

  // Confirm before proceeding
  console.log("\n===========================================");
  console.log("Configuration Summary:");
  console.log("===========================================");
  console.log(`  Project Title:      ${projectTitle}`);
  console.log(`  Package Long Name:  ${longName}`);
  console.log(`  Package Short Name: ${shortName}`);
  console.log(`  Upper Short Name:   ${upperShortName}`);
  console.log(`  Pascal Case Name:   ${pascalCaseName}`);
  console.log(`  Description:        ${description}`);
  console.log("===========================================\n");

  const confirm = await prompt("Proceed with creation? (yes/no)", "yes");
  if (confirm.toLowerCase() !== "yes" && confirm.toLowerCase() !== "y") {
    console.log("❌ Cancelled by user.");
    process.exit(0);
  }

  const root = path.resolve(__dirname, "../../..");
  const src = path.join(root, "packages", "aws-example");
  const dest = path.join(root, "packages", longName);

  if (!fs.existsSync(src)) {
    console.error("❌ Source package not found:", src);
    process.exit(1);
  }

  if (fs.existsSync(dest)) {
    console.error("❌ Destination already exists:", dest);
    process.exit(2);
  }

  console.log("\n📦 Creating new package...");
  console.log(`  Copying from: ${src}`);
  console.log(`  Copying to:   ${dest}\n`);

  // Copy the source package (excluding node_modules and build artifacts)
  copyRecursive(src, dest, [
    "node_modules",
    ".next",
    "dist",
    "build",
    ".nx",
    "deployment-outputs",
    ".cache",
  ]);

  console.log("✅ Files copied successfully");

  // Rename files that contain common placeholders in their filenames
  console.log(
    `\n🔄 Renaming files (placeholders → ${shortName}/${longName})...`,
  );
  // Perform PascalCase/uppercase filename renames first so we don't accidentally
  // lowercase existing PascalCase component or symbol names when a later
  // case-insensitive replace runs.
  renameFilesWithPatterns(dest, [
    { from: "AwsExample", to: pascalCaseName, flags: "g" },
    { from: "AWSExample", to: pascalCaseName, flags: "g" },
    { from: "Awse", to: capitalizedShortName, flags: "g" },
    { from: "AWSE", to: upperShortName, flags: "g" },
    // Lowercase / kebab-case replacements last (use word boundaries where helpful)
    { from: "\\baws-example\\b", to: longName, flags: "gi" },
    { from: "\\bawse\\b", to: shortName, flags: "g" },
  ]);

  console.log("✅ Files renamed successfully");

  // Update package.json name fields
  console.log(`\n📝 Updating package.json files...`);
  updatePackageJsonNames(dest, longName, shortName);

  console.log("✅ package.json files updated");

  // Replace tokens inside files
  console.log(
    `\n🔍 Replacing tokens in files (aws-example → ${longName}, awse → ${shortName})...`,
  );
  const replacements = [
    // Replace hardcoded titles with project title (must be before identifier replacements)
    {
      from: "AWS Example Application",
      to: `${projectTitle} Application`,
      flags: "g",
    },
    { from: "AWS Example", to: projectTitle, flags: "g" },
    // PascalCase and UPPERCASE replacements for component identifiers
    // and exported symbols that are already PascalCase stay PascalCase.
    { from: "AwsExample", to: pascalCaseName, flags: "g" },
    { from: "AWSExample", to: pascalCaseName, flags: "g" },
    { from: "Awse", to: capitalizedShortName, flags: "g" },
    { from: "AWSE", to: upperShortName, flags: "g" },
    // Lowercase / kebab-case replacements after. Use word boundaries to avoid
    // touching parts of identifiers that were handled above.
    { from: "\\baws-example\\b", to: longName, flags: "gi" },
    { from: "\\baws_example\\b", to: longName, flags: "gi" },
    { from: "\\bawse\\b", to: shortName, flags: "g" },
  ];
  replaceTokensInTree(dest, replacements);

  console.log("✅ Tokens replaced successfully");

  // Sanitize component filenames and update imports inside the created package
  try {
    sanitizeComponents(
      dest,
      longName,
      shortName,
      pascalCaseName,
      capitalizedShortName,
      upperShortName,
    );
    console.log("✅ Component sanitization complete");
  } catch (e) {
    console.warn(
      "⚠️  Component sanitization failed (non-fatal):",
      e && e.message ? e.message : e,
    );
  }

  // Add new package workspaces to root package.json (frontend/backend)
  console.log("\n🔧 Updating root package.json workspaces and scripts...");
  try {
    const rootPkgPath = path.join(root, "package.json");
    if (fs.existsSync(rootPkgPath)) {
      const rootPkg = JSON.parse(fs.readFileSync(rootPkgPath, "utf8"));
      if (!Array.isArray(rootPkg.workspaces))
        rootPkg.workspaces = rootPkg.workspaces || [];
      const frontendEntry = `packages/${longName}/frontend`;
      const backendEntry = `packages/${longName}/backend`;
      if (!rootPkg.workspaces.includes(frontendEntry))
        rootPkg.workspaces.push(frontendEntry);
      if (!rootPkg.workspaces.includes(backendEntry))
        rootPkg.workspaces.push(backendEntry);

      // Add dev script for the new package
      if (!rootPkg.scripts) rootPkg.scripts = {};
      const devScriptName = `dev:${shortName}`;
      const devScriptValue = `yarn workspace ${shortName}frontend dev:local`;
      if (!rootPkg.scripts[devScriptName]) {
        rootPkg.scripts[devScriptName] = devScriptValue;
        console.log(`   Added script: ${devScriptName}`);
      }

      fs.writeFileSync(rootPkgPath, JSON.stringify(rootPkg, null, 2) + "\n");
      console.log(
        "✅ Added workspace entries and dev script to root package.json",
      );
    }
  } catch (e) {
    console.error(
      "❌ Failed to update root package.json workspaces:",
      e && e.message ? e.message : e,
    );
  }

  // Run post-clone build steps: yarn install, build-gql, tsc, lint
  // Run post-clone steps but don't abort creation if one of them fails.
  // We'll run each command individually and catch errors so the overall
  // package creation always completes.
  (function runPostClone() {
    const { execSync } = require("child_process");
    console.log(
      "\n🔧 Running post-clone tasks: yarn install, build-gql, tsc, prettier, lint...",
    );

    // Install workspace dependencies (may be heavy) — required for tsc and build-gql
    try {
      execSync("yarn install", { stdio: "inherit", cwd: root });
    } catch (err) {
      console.error(
        "⚠️  yarn install failed:",
        err && err.message ? err.message : err,
      );
      console.log(
        "   Continuing — you may need to run 'yarn install' manually later.",
      );
    }

    // Determine the frontend workspace/package name from its package.json
    const frontendPkgPath = path.join(dest, "frontend", "package.json");
    let frontendPkgName = null;
    if (fs.existsSync(frontendPkgPath)) {
      try {
        const fp = JSON.parse(fs.readFileSync(frontendPkgPath, "utf8"));
        frontendPkgName = fp.name;
      } catch (e) {
        // ignore parse errors and fallback
      }
    }
    if (!frontendPkgName) frontendPkgName = `${shortName}frontend`;

    // Run build-gql for the new frontend (non-fatal)
    try {
      console.log(`\n➡️  Running build-gql for workspace ${frontendPkgName}`);
      execSync(`yarn workspace ${frontendPkgName} run build-gql`, {
        stdio: "inherit",
        cwd: root,
      });
    } catch (err) {
      console.error(
        `⚠️  build-gql failed for workspace ${frontendPkgName}:`,
        err && err.message ? err.message : err,
      );
      console.log(
        "   You may need to run the build-gql command manually inside the new workspace.",
      );
    }

    // Run TypeScript check for the backend package (non-fatal)
    try {
      console.log(`\n➡️  Running tsc for packages/${longName}/backend`);
      execSync(
        `./node_modules/.bin/tsc -p packages/${longName}/backend/tsconfig.json --noEmit`,
        { stdio: "inherit", cwd: root },
      );
    } catch (err) {
      console.error(
        `⚠️  tsc --noEmit failed for packages/${longName}/backend:`,
        err && err.message ? err.message : err,
      );
      console.log(
        "   TypeScript errors may need manual fixing in the new package.",
      );
    }

    // Run Prettier to auto-fix formatting in the new frontend, then run lint.
    try {
      console.log(
        `\n➡️  Running Prettier to format packages/${longName}/frontend`,
      );
      // Use npx so we use the workspace-installed prettier when available
      execSync(`npx prettier --write packages/${longName}/frontend`, {
        stdio: "inherit",
        cwd: root,
      });
    } catch (err) {
      console.error(
        `⚠️  Prettier formatting failed:`,
        err && err.message ? err.message : err,
      );
      console.log(
        "   You may need to run Prettier manually in the new package.",
      );
    }

    // Run linter across workspace but do not let lint failures abort creation
    try {
      console.log(`\n➡️  Running yarn lint`);
      execSync(`yarn lint`, { stdio: "inherit", cwd: root });
      console.log("\n✅ Lint completed");
    } catch (err) {
      console.warn(
        "⚠️  Lint failed (non-fatal):",
        err && err.message ? err.message : err,
      );
      console.log(
        "   The package was created; run 'yarn lint' locally to inspect/fix issues.",
      );
    }

    console.log("\n✅ Post-clone tasks finished (some steps may have failed)");
  })();

  // Add new package workspaces to root package.json (frontend/backend)
  console.log("\n🔧 Updating root package.json workspaces and scripts...");
  try {
    const rootPkgPath = path.join(root, "package.json");
    if (fs.existsSync(rootPkgPath)) {
      const rootPkg = JSON.parse(fs.readFileSync(rootPkgPath, "utf8"));
      if (!Array.isArray(rootPkg.workspaces))
        rootPkg.workspaces = rootPkg.workspaces || [];
      const frontendEntry = `packages/${longName}/frontend`;
      const backendEntry = `packages/${longName}/backend`;
      if (!rootPkg.workspaces.includes(frontendEntry))
        rootPkg.workspaces.push(frontendEntry);
      if (!rootPkg.workspaces.includes(backendEntry))
        rootPkg.workspaces.push(backendEntry);

      // Add dev script for the new package
      if (!rootPkg.scripts) rootPkg.scripts = {};
      const devScriptName = `dev:${shortName}`;
      const devScriptValue = `yarn workspace ${shortName}frontend dev:local`;
      if (!rootPkg.scripts[devScriptName]) {
        rootPkg.scripts[devScriptName] = devScriptValue;
        console.log(`   Added script: ${devScriptName}`);
      }

      fs.writeFileSync(rootPkgPath, JSON.stringify(rootPkg, null, 2) + "\n");
      console.log(
        "✅ Added workspace entries and dev script to root package.json",
      );
    }
  } catch (e) {
    console.error(
      "❌ Failed to update root package.json workspaces:",
      e && e.message ? e.message : e,
    );
  }

  // Update the deploy package to include the new stack
  console.log("\n🔧 Adding stack type to deploy package...");
  try {
    const deployTypesPath = path.join(root, "packages", "deploy", "types.ts");
    if (fs.existsSync(deployTypesPath)) {
      let content = fs.readFileSync(deployTypesPath, "utf8");

      // Add new stack type to enum (using PascalCase)
      // Find the last entry in the enum (ends with ,) and insert after it
      const stackTypeEnumRegex = /(export enum StackType \{[\s\S]*?),(\s*\})/;
      if (!content.includes(`${pascalCaseName} = "${pascalCaseName}"`)) {
        content = content.replace(
          stackTypeEnumRegex,
          `$1,\n  ${pascalCaseName} = "${pascalCaseName}",$2`,
        );
      }

      // Add to STACK_ORDER
      // Find the last entry in the array (ends with ,) and insert after it
      const stackOrderRegex = /(export const STACK_ORDER = \[[\s\S]*?),(\s*\])/;
      if (!content.includes(`StackType.${pascalCaseName}`)) {
        content = content.replace(
          stackOrderRegex,
          `$1,\n  StackType.${pascalCaseName},$2`,
        );
      }

      // Add template path
      // Find the last entry before the closing comment/brace
      const templatePathsRegex =
        /(export const TEMPLATE_PATHS: Record<StackType, string> = \{[\s\S]*?\),)(\s*\/\/[^\n]*\n\s*\})/;
      const templatePath = `join(__dirname, "templates/${longName}/cfn-template.yaml")`;
      if (!content.includes(`[StackType.${pascalCaseName}]`)) {
        content = content.replace(
          templatePathsRegex,
          `$1\n  [StackType.${pascalCaseName}]: ${templatePath},$2`,
        );
      }

      // Add template resources path
      // Find the last entry before the closing comment/brace
      const resourcesPathsRegex =
        /(export const TEMPLATE_RESOURCES_PATHS: Record<StackType, string> = \{[\s\S]*?\),)(\s*\/\/[^\n]*\n\s*\})/;
      const resourcesPath = `join(__dirname, "templates/${longName}/")`;
      if (!content.includes(`[StackType.${pascalCaseName}]: join`)) {
        content = content.replace(
          resourcesPathsRegex,
          `$1\n  [StackType.${pascalCaseName}]: ${resourcesPath},$2`,
        );
      }

      fs.writeFileSync(deployTypesPath, content, "utf8");
      console.log("✅ Updated deploy/types.ts");
    }
  } catch (e) {
    console.error("⚠️  Failed to update deploy types:", e.message);
    console.log(
      "   You may need to manually add the stack type to packages/deploy/types.ts",
    );
  }

  // Update project-config.ts with the new project configuration
  console.log(
    "\n🔧 Adding project configuration to deploy/project-config.ts...",
  );
  try {
    const projectConfigPath = path.join(
      root,
      "packages",
      "deploy",
      "project-config.ts",
    );
    if (fs.existsSync(projectConfigPath)) {
      let content = fs.readFileSync(projectConfigPath, "utf8");

      // Create the new project configuration entry
      const newProjectConfig = `\n  [StackType.${pascalCaseName}]: {\n    stackType: StackType.${pascalCaseName},\n    displayName: "${projectTitle}",\n    templateDir: "${longName}",\n    packageDir: "${longName}",\n    dependsOn: [StackType.Shared], // TODO: Update dependencies as needed\n    buckets: {\n      templates: "nlmonorepo-${longName}-templates-{stage}",\n      frontend: "nlmonorepo-${shortName}-userfiles-{stage}",\n      additional: ["nlmonorepo-{stage}-cfn-templates-{region}"],\n    },\n    hasFrontend: true,\n    hasLambdas: true,\n    hasResolvers: true,\n  },\n`;

      // Find the last config entry (ends with },) and add after it
      const projectConfigsRegex =
        /(export const PROJECT_CONFIGS: Record<StackType, ProjectConfig> = \{[\s\S]*?  \},)(\s*\};)/;
      if (!content.includes(`[StackType.${pascalCaseName}]:`)) {
        content = content.replace(
          projectConfigsRegex,
          `$1${newProjectConfig}$2`,
        );
        fs.writeFileSync(projectConfigPath, content, "utf8");
        console.log("✅ Updated deploy/project-config.ts");
      } else {
        console.log(
          "⚠️  Project already exists in project-config.ts, skipping",
        );
      }
    } else {
      console.warn(
        "⚠️  project-config.ts not found - you may need to add project configuration manually",
      );
    }
  } catch (e) {
    console.error("⚠️  Failed to update project-config.ts:", e.message);
    console.log(
      "   You may need to manually add the project configuration to packages/deploy/project-config.ts",
    );
  }

  console.log("\n===========================================");
  console.log("✅ Package created successfully!");
  console.log("===========================================");
  console.log(`\n📍 Location: ${dest}\n`);
  console.log("✅ Auto-configured:");
  console.log(`   • Added to root package.json workspaces`);
  console.log(`   • Added StackType.${pascalCaseName} to deploy/types.ts`);
  console.log(`   • Added project config to deploy/project-config.ts`);
  console.log("\nNext steps:");
  console.log(
    `  1. Review project configuration in packages/deploy/project-config.ts`,
  );
  console.log(
    `     - Update dependencies (currently set to [StackType.Shared])`,
  );
  console.log(`     - Adjust bucket naming patterns if needed`);
  console.log(`     - Set hasFrontend/hasLambdas/hasResolvers flags correctly`);
  console.log(`  2. Create deployment function at:`);
  console.log(`     packages/deploy/packages/${longName}/${longName}.ts`);
  console.log(`  3. Register deployment function in packages/deploy/index.ts`);
  console.log(`     (See deployAwsExample or deployCwl for examples)`);
  console.log(`  4. Create CloudFormation templates in:`);
  console.log(`     packages/deploy/templates/${longName}/`);
  console.log(
    `  5. Update service-specific configuration (Sentry, ports, etc.)`,
  );
  console.log(`  6. Run 'yarn deploy' to deploy your new stack\n`);
}

main().catch((err) => {
  console.error("❌ An error occurred:", err);
  process.exit(1);
});
