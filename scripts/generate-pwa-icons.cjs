const fs = require("fs");
const path = require("path");

const sharp = require(
  "C:/Users/Seebe/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/.pnpm/sharp@0.34.5/node_modules/sharp"
);

const outputDir = path.resolve(__dirname, "../desktop-app/icons");
fs.mkdirSync(outputDir, { recursive: true });

function iconSvg(size, maskable = false) {
  const inset = maskable ? Math.round(size * 0.16) : Math.round(size * 0.09);
  const center = size / 2;
  const discRadius = Math.round(size * 0.32);
  const noteX = Math.round(size * 0.56);
  const noteTop = Math.round(size * 0.27);
  const noteBottom = Math.round(size * 0.67);

  return `
    <svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stop-color="#ff2d55"/>
          <stop offset="0.5" stop-color="#9b3dff"/>
          <stop offset="1" stop-color="#00d1ff"/>
        </linearGradient>
        <radialGradient id="disc" cx="42%" cy="35%" r="70%">
          <stop offset="0" stop-color="#2b2731"/>
          <stop offset="1" stop-color="#08080a"/>
        </radialGradient>
      </defs>
      <rect width="${size}" height="${size}" rx="${Math.round(size * 0.22)}" fill="#08080a"/>
      <rect x="${inset}" y="${inset}" width="${size - inset * 2}" height="${size - inset * 2}" rx="${Math.round(size * 0.16)}" fill="url(#bg)"/>
      <circle cx="${center}" cy="${center}" r="${discRadius}" fill="url(#disc)" stroke="rgba(255,255,255,.28)" stroke-width="${Math.max(2, Math.round(size * 0.012))}"/>
      <circle cx="${center}" cy="${center}" r="${Math.round(size * 0.055)}" fill="#f7f7fb"/>
      <path d="M ${noteX} ${noteTop} L ${Math.round(size * 0.72)} ${Math.round(size * 0.22)} L ${Math.round(size * 0.72)} ${Math.round(size * 0.55)}"
            fill="none" stroke="#f7f7fb" stroke-width="${Math.round(size * 0.055)}" stroke-linecap="round" stroke-linejoin="round"/>
      <circle cx="${Math.round(size * 0.51)}" cy="${noteBottom}" r="${Math.round(size * 0.09)}" fill="#f7f7fb"/>
      <circle cx="${Math.round(size * 0.67)}" cy="${Math.round(size * 0.59)}" r="${Math.round(size * 0.09)}" fill="#f7f7fb"/>
      <path d="M ${Math.round(size * 0.23)} ${Math.round(size * 0.73)} C ${Math.round(size * 0.32)} ${Math.round(size * 0.62)}, ${Math.round(size * 0.37)} ${Math.round(size * 0.81)}, ${Math.round(size * 0.46)} ${Math.round(size * 0.7)}"
            fill="none" stroke="#b6ff4d" stroke-width="${Math.round(size * 0.025)}" stroke-linecap="round"/>
    </svg>
  `;
}

async function render(name, size, maskable = false) {
  await sharp(Buffer.from(iconSvg(size, maskable))).png().toFile(path.join(outputDir, name));
}

Promise.all([
  render("icon-192.png", 192),
  render("icon-512.png", 512),
  render("icon-maskable-512.png", 512, true),
  render("apple-touch-icon.png", 180)
]).catch(error => {
  console.error(error);
  process.exitCode = 1;
});
