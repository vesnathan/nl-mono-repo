#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');

function collectTopLevelPackageDirs() {
  const packagesRoot = path.join(root, 'packages');
  if (!fs.existsSync(packagesRoot)) return [];
  return fs.readdirSync(packagesRoot).filter((d) => {
    try {
      return fs.statSync(path.join(packagesRoot, d)).isDirectory();
    } catch (e) {
      return false;
    }
  });
}

function collectAllPackageJsons() {
  const base = path.join(root, 'packages');
  const results = [];
  function walk(dir) {
    const items = fs.readdirSync(dir, { withFileTypes: true });
    for (const it of items) {
      if (it.name === 'node_modules') continue;
      const full = path.join(dir, it.name);
      if (it.isDirectory()) {
        walk(full);
      } else if (it.isFile() && it.name === 'package.json') {
        results.push(full);
      }
    }
  }
  if (fs.existsSync(base)) walk(base);
  return results;
}

function getLocalPackageNames(longName) {
  const pkgDir = path.join(root, 'packages', longName);
  const names = new Set();
  if (!fs.existsSync(pkgDir)) return Array.from(names);
  function walk(dir) {
    const items = fs.readdirSync(dir, { withFileTypes: true });
    for (const it of items) {
      const full = path.join(dir, it.name);
      if (it.isDirectory()) {
        if (it.name === 'node_modules') continue;
        walk(full);
      } else if (it.isFile() && it.name === 'package.json') {
        try {
          const pkg = JSON.parse(fs.readFileSync(full, 'utf8'));
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

function findDependents(targetNames, excludeLongName) {
  const dependents = [];
  const allPkgJsons = collectAllPackageJsons();
  for (const pj of allPkgJsons) {
    // skip package.json files that live under the target package directory
    if (excludeLongName && pj.indexOf(path.join('packages', excludeLongName)) !== -1) continue;
    try {
      const content = JSON.parse(fs.readFileSync(pj, 'utf8'));
      const deps = Object.assign({}, content.dependencies || {}, content.devDependencies || {}, content.peerDependencies || {}, content.optionalDependencies || {});
      const matched = [];
      for (const tn of targetNames) {
        if (deps && Object.prototype.hasOwnProperty.call(deps, tn)) matched.push(tn);
      }
      if (matched.length > 0) {
        const dependentPkgName = content.name || path.basename(path.dirname(pj));
        dependents.push({ packageJson: pj, packageName: dependentPkgName, matches: matched });
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
  const idx = parts.indexOf('packages');
  if (idx === -1) return parts[0] || null;
  return parts[idx + 1] || null;
}

function isPackageDeployed(longName) {
  if (!longName) return false;
  const templatesDir = path.join(root, 'packages', 'deploy', 'templates', longName);
  if (fs.existsSync(templatesDir)) return true;
  try {
    const projConfigPath = path.join(root, 'packages', 'deploy', 'project-config.ts');
    if (!fs.existsSync(projConfigPath)) return false;
    const content = fs.readFileSync(projConfigPath, 'utf8');
    if (content.includes(`templateDir: "${longName}"`) || content.includes(`packageDir: "${longName}"`) || content.includes(`templates/${longName}/`)) {
      return true;
    }
  } catch (e) {}
  return false;
}

function main() {
  const protectedPackages = new Set(['aws-bootstrap', 'deploy', 'shared', 'waf']);
  const tops = collectTopLevelPackageDirs().filter(p => !protectedPackages.has(p));
  if (tops.length === 0) {
    console.log('No removable packages found under packages/ (none or only protected packages).');
    return;
  }
  const items = tops.map((pkgName) => {
    const localNames = getLocalPackageNames(pkgName);
    const dependents = findDependents(localNames, pkgName) || [];
    const deployedDependents = dependents.filter((d) => {
      const dependentLongName = getLongNameFromPackageJsonPath(d.packageJson);
      return isPackageDeployed(dependentLongName);
    });
    if (deployedDependents.length > 0) {
      return { label: pkgName, disabled: true, reason: deployedDependents.map(d => d.packageName).join(', ') };
    }
    return { label: pkgName, disabled: false };
  });

  // Print a user-friendly list where disabled items are greyed out (ANSI dim)
  console.log('\nRemovable packages:');
  items.forEach((it, idx) => {
    const num = String(idx + 1).padStart(2, ' ');
    if (it.disabled) {
      console.log(` ${num}) \x1b[2m${it.label} (blocked by ${it.reason})\x1b[0m`);
    } else {
      console.log(` ${num}) ${it.label}`);
    }
  });
  console.log('\nNote: greyed items are blocked because a deployed package depends on them. Remove or undeploy those packages first.');
}

main();
