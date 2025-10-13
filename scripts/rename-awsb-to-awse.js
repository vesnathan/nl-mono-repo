const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const IGNORES = ['.git', 'node_modules', 'dist', 'build', '.cache', '.venv'];
const MAX_SIZE = 1024 * 1024; // 1MB

const textFileExt = new Set([
  '.js', '.ts', '.json', '.md', '.yaml', '.yml', '.env', '.sh', '.tsx', '.jsx', '.html', '.css', '.scss', '.txt', '.gitignore', '.graphql'
]);

function shouldIgnore(p) {
  return IGNORES.some(ignore => p.includes(path.sep + ignore + path.sep) || p.endsWith(path.sep + ignore));
}

function isBinary(filename) {
  const ext = path.extname(filename).toLowerCase();
  if (textFileExt.has(ext)) return false;
  // treat unknown small files as text
  try {
    const stat = fs.statSync(filename);
    if (stat.size === 0 || stat.size > MAX_SIZE) return true;
  } catch (e) {
    return true;
  }
  return false;
}

function replaceInFile(file) {
  try {
    const stat = fs.statSync(file);
    if (!stat.isFile()) return false;
    if (stat.size > MAX_SIZE) return false;
    if (isBinary(file)) return false;
    const original = fs.readFileSync(file, 'utf8');
    let updated = original
      // replace inside identifiers as well (no word boundaries)
      .replace(/AWSE/g, 'AWSE')
      .replace(/Awse/g, 'Awse')
      .replace(/awse/g, 'awse');
    if (updated !== original) {
      fs.writeFileSync(file, updated, 'utf8');
      return true;
    }
  } catch (e) {
    console.error('skip', file, e.message);
  }
  return false;
}

function walk(dir) {
  const changed = [];
  const list = fs.readdirSync(dir);
  for (const name of list) {
    const full = path.join(dir, name);
    if (shouldIgnore(full)) continue;
    const stat = fs.statSync(full);
    if (stat.isDirectory()) {
      changed.push(...walk(full));
    } else if (stat.isFile()) {
      if (replaceInFile(full)) changed.push(full);
    }
  }
  return changed;
}

const changed = walk(root);
console.log('FILES_CHANGED_COUNT=' + changed.length);
changed.forEach(f => console.log(f));
