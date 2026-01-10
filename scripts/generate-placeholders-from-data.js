const fs = require('fs');
const path = require('path');

const dataFiles = [
  path.join(__dirname, '..', 'web', 'data', 'characters.ts'),
  path.join(__dirname, '..', 'web', 'data', 'charactersExtended.ts'),
  path.join(__dirname, '..', 'web', 'data', 'charactersMassive.ts'),
];
const outDir = path.join(__dirname, '..', 'web', 'public', 'wallpapers', 'default');
fs.mkdirSync(outDir, { recursive: true });

function hexToRgb(hex) {
  if (!hex) return null;
  hex = hex.replace('#', '');
  if (hex.length === 3) hex = hex.split('').map(c => c + c).join('');
  const num = parseInt(hex, 16);
  return { r: (num >> 16) & 255, g: (num >> 8) & 255, b: num & 255 };
}
function luminance(rgb) {
  if (!rgb) return 0;
  const a = [rgb.r, rgb.g, rgb.b].map(v => {
    v /= 255;
    return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * a[0] + 0.7152 * a[1] + 0.0722 * a[2];
}
function escapeXml(s) {
  return s.replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&apos;' }[c]));
}

const manifest = [];

for (const file of dataFiles) {
  if (!fs.existsSync(file)) continue;
  const text = fs.readFileSync(file, 'utf8');
  const itemRegex = /\{([\s\S]*?)\}/g;
  // Find objects that contain id and name
  let m;
  while ((m = itemRegex.exec(text)) !== null) {
    const block = m[1];
    const idMatch = /id:\s*'([^']+)'/.exec(block);
    const nameMatch = /name:\s*'([^']+)'/.exec(block);
    if (!idMatch || !nameMatch) continue;
    const id = idMatch[1].trim();
    const name = nameMatch[1].trim();
    const colorsMatch = /colors:\s*\{([\s\S]*?)\}/.exec(block);
    let primary = '#777777';
    if (colorsMatch) {
      const prm = /primary:\s*'([^']+)'/.exec(colorsMatch[1]);
      if (prm) primary = prm[1];
    }
    const rgb = hexToRgb(primary);
    const lum = luminance(rgb);
    const fg = lum > 0.5 ? '#111111' : '#ffffff';

    const safeId = id.replace(/[^a-z0-9-_]/gi, '_');
    const filename = `${safeId}.svg`;
    const svg = `<?xml version="1.0" encoding="UTF-8"?>\n` +
      `<svg xmlns="http://www.w3.org/2000/svg" width="1920" height="1080">\n` +
      `  <rect width="100%" height="100%" fill="${primary}" />\n` +
      `  <text x="50%" y="52%" font-family="Inter, Arial, Helvetica, sans-serif" text-anchor="middle" ` +
      `font-size="72" fill="${fg}" dominant-baseline="middle">${escapeXml(name)}</text>\n` +
      `  <text x="50%" y="86%" font-family="Inter, Arial, Helvetica, sans-serif" text-anchor="middle" ` +
      `font-size="28" fill="${fg}" opacity="0.85">${escapeXml(id)}</text>\n` +
      `</svg>\n`;
    const outPath = path.join(outDir, filename);
    fs.writeFileSync(outPath, svg, 'utf8');
    manifest.push({ id, name, file: `/${path.posix.join('wallpapers', 'default', filename)}`, color: primary });
  }
}

fs.writeFileSync(path.join(outDir, 'manifest.json'), JSON.stringify(manifest, null, 2), 'utf8');
console.log('Generated', manifest.length, 'placeholders in', outDir);