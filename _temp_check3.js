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

const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));
const allDeps = Object.assign({}, pkg.dependencies || {}, pkg.devDependencies || {});

const knownModules = new Set([
  'react', 'react-dom', 'next', 'next/navigation', 'next/link', 'next/image',
  'next/headers', 'next/server',
  'next-intl', 'next-intl/server',
  'class-variance-authority', 'clsx', 'tailwind-merge',
  'date-fns', 'framer-motion', 'lucide-react',
  'qrcode', 'qrcode.react',
  'react-day-picker', 'react-hook-form', 'react-phone-number-input',
  'recharts', 'stripe', 'three', 'zod', 'zustand',
]);

// Add all @radix-ui, @supabase, @react-three, @stripe, @hookform subpaths
for (const dep of Object.keys(allDeps)) {
  knownModules.add(dep);
}

const allFiles = getAllTsFiles('src');
if (fs.existsSync('mobile')) allFiles.push(...getAllTsFiles('mobile'));

const issues = [];
for (const file of allFiles) {
  const content = fs.readFileSync(file, 'utf8');
  const lines = content.split('\n');
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const match = line.match(/from\s+['"]([^.'@][^'"]*|@[^/][^'"]*)['"]/);
    if (match) {
      const pkgName = match[1];
      if (pkgName.startsWith('node:')) continue;
      const basePkg = pkgName.startsWith('@') ? pkgName.split('/').slice(0, 2).join('/') : pkgName.split('/')[0];
      if (knownModules.has(basePkg) || allDeps[basePkg]) continue;
      issues.push({ file, line: i + 1, pkg: pkgName, code: line.trim() });
    }
  }
}

if (issues.length === 0) {
  console.log('No missing npm package imports found.');
} else {
  console.log('POTENTIALLY MISSING NPM PACKAGES: ' + issues.length + ' issues');
  console.log('');
  for (const issue of issues) {
    console.log('FILE: ' + issue.file + ':' + issue.line);
    console.log('PACKAGE: ' + issue.pkg);
    console.log('LINE: ' + issue.code);
    console.log('');
  }
}
