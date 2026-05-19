/**
 * KinéPro — PWA icon generator
 * Generates all required PNG icon sizes from an embedded SVG.
 * Run: node scripts/generate-icons.js
 */
const sharp = require('sharp')
const path  = require('path')
const fs    = require('fs')

const SIZES = [72, 96, 128, 144, 152, 192, 384, 512]
const OUT   = path.join(__dirname, '..', 'public', 'icons')

// KinéPro brand SVG icon
// Dark navy square with "K" monogram and spine-dot motif
function makeSvg(size) {
  const pad     = Math.round(size * 0.12)
  const radius  = Math.round(size * 0.18)
  const kSize   = Math.round(size * 0.52)
  const cx      = size / 2
  const cy      = size / 2

  // Spine dots — three stacked circles on the right side of the K
  const dotR  = Math.round(size * 0.038)
  const dotX  = Math.round(cx + kSize * 0.27)
  const dotY1 = Math.round(cy - kSize * 0.22)
  const dotY2 = Math.round(cy)
  const dotY3 = Math.round(cy + kSize * 0.22)

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
  <!-- Background -->
  <rect width="${size}" height="${size}" rx="${radius}" fill="#1E3A5F"/>
  <!-- Subtle gradient overlay -->
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#1D4ED8" stop-opacity="0.35"/>
      <stop offset="100%" stop-color="#0F172A" stop-opacity="0.2"/>
    </linearGradient>
  </defs>
  <rect width="${size}" height="${size}" rx="${radius}" fill="url(#bg)"/>
  <!-- K letterform -->
  <text
    x="${cx - kSize * 0.07}"
    y="${cy + kSize * 0.38}"
    font-family="Georgia, 'Times New Roman', serif"
    font-size="${kSize}"
    font-weight="bold"
    fill="white"
    text-anchor="middle"
    letter-spacing="-2"
  >K</text>
  <!-- Spine accent dots (blue) -->
  <circle cx="${dotX}" cy="${dotY1}" r="${dotR}" fill="#60A5FA"/>
  <circle cx="${dotX}" cy="${dotY2}" r="${dotR}" fill="#3B82F6"/>
  <circle cx="${dotX}" cy="${dotY3}" r="${dotR}" fill="#60A5FA"/>
</svg>`
}

async function generate() {
  if (!fs.existsSync(OUT)) fs.mkdirSync(OUT, { recursive: true })

  for (const size of SIZES) {
    const svg  = Buffer.from(makeSvg(size))
    const file = path.join(OUT, `icon-${size}x${size}.png`)
    await sharp(svg).png().toFile(file)
    console.log(`✓ icon-${size}x${size}.png`)
  }

  // Also generate badge (72×72 monochrome for Android notification bar)
  const badgeSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="72" height="72" viewBox="0 0 72 72">
  <rect width="72" height="72" rx="12" fill="white"/>
  <text x="36" y="52" font-family="Georgia, serif" font-size="40" font-weight="bold"
    fill="#1E3A5F" text-anchor="middle">K</text>
</svg>`
  await sharp(Buffer.from(badgeSvg)).png().toFile(path.join(OUT, 'badge-72x72.png'))
  console.log('✓ badge-72x72.png')

  console.log(`\n🎉 All icons generated in public/icons/`)
}

generate().catch(console.error)
