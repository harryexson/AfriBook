const fs = require('fs');
const path = require('path');
const lr = require('lucide-react');
const exports = new Set(Object.keys(lr));

function getAllTsFiles(dir) {
  let results = [];
  const items = fs.readdirSync(dir, {withFileTypes: true});
  for (const item of items) {
    const fullPath = path.join(dir, item.name);
    if (item.isDirectory()) results = results.concat(getAllTsFiles(fullPath));
    else if (item.name.endsWith('.ts') || item.name.endsWith('.tsx')) results.push(fullPath);
  }
  return results;
}

const srcDir = 'src';
const files = getAllTsFiles(srcDir);
const issues = [];

for (const file of files) {
  const content = fs.readFileSync(file, 'utf8');
  const lines = content.split('\n');
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const match = line.match(/import\s*\{([^}]+)\}\s*from\s*['"]lucide-react['"]/);
    if (match) {
      const names = match[1].split(',').map(s => s.trim()).filter(s => s && !s.startsWith('type ') && s !== 'LucideIcon');
      for (const name of names) {
        const cleanName = name.replace(/\s+as\s+\w+/, '').trim();
        if (cleanName && !exports.has(cleanName)) {
          issues.push({ file, line: i + 1, icon: cleanName, code: line.trim() });
        }
      }
    }
  }
}

if (issues.length === 0) {
  console.log('No missing lucide-react icons found.');
} else {
  console.log('MISSING LUCIDE-REACT ICONS: ' + issues.length + ' issues');
  console.log('');
  for (const issue of issues) {
    console.log('FILE: ' + issue.file + ':' + issue.line);
    console.log('ICON: ' + issue.icon);
    console.log('LINE: ' + issue.code);
    console.log('');
  }
}
