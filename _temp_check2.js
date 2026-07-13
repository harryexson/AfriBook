const fs = require('fs');
const path = require('path');

function getAllTsFiles(dir) {
  let results = [];
  try {
    const items = fs.readdirSync(dir, {withFileTypes: true});
    for (const item of items) {
      const fullPath = path.join(dir, item.name);
      if (item.isDirectory()) results = results.concat(getAllTsFiles(fullPath));
      else if (item.name.endsWith('.ts') || item.name.endsWith('.tsx')) results.push(fullPath);
    }
  } catch(e) {}
  return results;
}

const cutoff = new Date('2026-07-09T00:00:00');
const srcFiles = getAllTsFiles('src');
const mobileDir = 'mobile';
const mobileFiles = fs.existsSync(mobileDir) ? getAllTsFiles(mobileDir) : [];
const allFiles = [...srcFiles, ...mobileFiles];

const issues = [];
for (const file of allFiles) {
  const stat = fs.statSync(file);
  if (stat.mtime < cutoff) continue;

  const content = fs.readFileSync(file, 'utf8');
  const lines = content.split('\n');
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    // Match @/ imports
    const atMatch = line.match(/from\s+['"]@\/([^'"]+)['"]/);
    if (atMatch) {
      const importPath = atMatch[1];
      const candidates = [
        path.join('src', importPath + '.ts'),
        path.join('src', importPath + '.tsx'),
        path.join('src', importPath, 'index.ts'),
        path.join('src', importPath, 'index.tsx'),
      ];
      const found = candidates.some(c => fs.existsSync(c));
      if (!found) {
        issues.push({ file, line: i + 1, importPath, code: line.trim(), type: '@/import' });
      }
    }

    // Match relative imports
    const relMatch = line.match(/from\s+['"](\.\.?\/[^'"]+)['"]/);
    if (relMatch) {
      const importPath = relMatch[1];
      const dir = path.dirname(file);
      const resolved = path.resolve(dir, importPath);
      const candidates = [
        resolved + '.ts',
        resolved + '.tsx',
        resolved + '.js',
        resolved + '.jsx',
        path.join(resolved, 'index.ts'),
        path.join(resolved, 'index.tsx'),
        path.join(resolved, 'index.js'),
      ];
      const found = candidates.some(c => {
        try { return fs.existsSync(c); } catch(e) { return false; }
      });
      if (!found && fs.existsSync(resolved)) {
        // It might be a directory without an index file, but that's ok
      } else if (!found) {
        issues.push({ file, line: i + 1, importPath: relMatch[1], code: line.trim(), type: 'relative' });
      }
    }
  }
}

if (issues.length === 0) {
  console.log('No broken local imports found in recently modified files.');
} else {
  console.log('BROKEN LOCAL IMPORTS in recently modified files: ' + issues.length + ' issues');
  console.log('');
  for (const issue of issues) {
    console.log('FILE: ' + issue.file + ':' + issue.line);
    console.log('TYPE: ' + issue.type);
    console.log('IMPORT: ' + issue.importPath);
    console.log('LINE: ' + issue.code);
    console.log('');
  }
}
