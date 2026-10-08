const fs = require('fs');
const path = require('path');

const sourceDir = "C:\\Users\\jithy\\.gemini\\antigravity-ide\\brain\\5183b00e-9f48-4e74-8245-a1006ec81318";
const targetDir = path.join(__dirname, 'frontend', 'assets', 'avatars');

if (!fs.existsSync(targetDir)) {
  fs.mkdirSync(targetDir, { recursive: true });
}

const map = {
  'lion.png': 'lion_avatar_1791441791761.jpg',
  'elephant.png': 'elephant_avatar_1791441809840.jpg',
  'owl.png': 'owl_avatar_1791441829883.jpg',
  'rabbit.png': 'rabbit_avatar_1791441855573.jpg',
};

for (const [outName, srcName] of Object.entries(map)) {
  const src = path.join(sourceDir, srcName);
  const dest = path.join(targetDir, outName);
  if (fs.existsSync(src)) {
    fs.copyFileSync(src, dest);
    console.log(`Copied ${outName}`);
  }
}
