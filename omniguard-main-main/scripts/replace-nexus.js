const fs = require('fs');
const path = require('path');

const walk = (dir) => {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach((file) => {
    file = path.join(dir, file);
    const stat = fs.statSync(file);
    if (stat && stat.isDirectory()) {
      if (!file.includes('node_modules') && !file.includes('.git')) {
        results = results.concat(walk(file));
      }
    } else {
      if (file.endsWith('.js') || file.endsWith('.json') || file.endsWith('.md') || file.endsWith('.ts')) {
        results.push(file);
      }
    }
  });
  return results;
};

const files = walk(process.cwd());
let replacedFiles = 0;

files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  const original = content;
  
  // Replace variations
  content = content.replace(/Architecture Nexus/gi, 'Architecture Nexus');
  content = content.replace(/Architecture Nexus/gi, 'Architecture Nexus');
  content = content.replace(/Architecture Nexus/gi, 'Architecture Nexus');
  
  if (content !== original) {
    fs.writeFileSync(file, content, 'utf8');
    replacedFiles++;
    console.log(`Updated ${file}`);
  }
});

console.log(`Finished replacing in ${replacedFiles} files.`);
