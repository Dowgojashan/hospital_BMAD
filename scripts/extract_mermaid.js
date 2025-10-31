const fs = require('fs');
const path = require('path');

const workDir = path.resolve(__dirname, '..');
const mdPath = path.join(workDir, 'prd_1.md');
const outMdPath = path.join(workDir, 'prd_1_images.md');
const imagesDir = path.join(workDir, 'images');

if (!fs.existsSync(mdPath)) {
  console.error('prd_1.md not found');
  process.exit(2);
}
if (!fs.existsSync(imagesDir)) fs.mkdirSync(imagesDir, { recursive: true });

const md = fs.readFileSync(mdPath, 'utf8');
const mermaidRe = /```mermaid\s*([\s\S]*?)```/gm;
let match;
let i = 0;
let lastIndex = 0;
let out = '';
while ((match = mermaidRe.exec(md)) !== null) {
  i += 1;
  const code = match[1];
  const mmdPath = path.join(imagesDir, `diagram-${i}.mmd`);
  fs.writeFileSync(mmdPath, code, 'utf8');
  // append previous text
  out += md.slice(lastIndex, match.index);
  // insert image link placeholder
  out += `![](images/diagram-${i}.png)`;
  lastIndex = match.index + match[0].length;
}
out += md.slice(lastIndex);
fs.writeFileSync(outMdPath, out, 'utf8');
console.log(`extracted:${i}`);
