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
  const existsTemplates = fs.existsSync(templatesDir);
  let projectConfigHit = false;
  try {
    const projConfigPath = path.join(root, 'packages', 'deploy', 'project-config.ts');
    if (fs.existsSync(projConfigPath)) {
      const content = fs.readFileSync(projConfigPath, 'utf8');
      if (content.includes(`templateDir: "${longName}"`) || content.includes(`packageDir: "${longName}"`) || content.includes(`templates/${longName}/`)) {
        projectConfigHit = true;
      }
    }
  } catch (e) {}
  return { existsTemplates, projectConfigHit };
}

function main() {
  const protectedPackages = new Set(['aws-bootstrap', 'deploy', 'shared', 'waf']);
  const tops = collectTopLevelPackageDirs().filter(p => !protectedPackages.has(p));
  if (tops.length === 0) {
    console.log('No removable packages found under packages/ (none or only protected packages).');
    return;
  }

  tops.forEach((pkgName) => {
    console.log(`\nPackage: ${pkgName}`);
    const localNames = getLocalPackageNames(pkgName);
    console.log('  Local package names found:', localNames.length ? localNames.join(', ') : '(none)');
    const dependents = findDependents(localNames, pkgName) || [];
    if (dependents.length === 0) {
      console.log('  Dependents: (none)');
    } else {
      console.log('  Dependents:');
      dependents.forEach((d) => {
        const dependentLongName = getLongNameFromPackageJsonPath(d.packageJson);
        const deployInfo = isPackageDeployed(dependentLongName);
        const deployed = deployInfo.existsTemplates || deployInfo.projectConfigHit;
        console.log(`    - ${d.packageName} (package.json: ${d.packageJson})`);
        console.log(`      matches: ${d.matches.join(', ')}`);
        console.log(`      dependent long name: ${dependentLongName}`);
        console.log(`      deployed detection: templatesExists=${deployInfo.existsTemplates}, projectConfigHit=${deployInfo.projectConfigHit}`);
        console.log(`      considered deployed? ${deployed}`);
      });
    }

    const selfDeployInfo = isPackageDeployed(pkgName);
    console.log(`  Self deployed detection for ${pkgName}: templatesExists=${selfDeployInfo.existsTemplates}, projectConfigHit=${selfDeployInfo.projectConfigHit}`);
  });
}

main();
