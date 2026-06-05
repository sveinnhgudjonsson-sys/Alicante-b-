// Run once: node scripts/generate-icons.mjs
// Requires: npm install --save-dev sharp
import sharp from 'sharp'
import { readFileSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dir = dirname(fileURLToPath(import.meta.url))
const svg = readFileSync(join(__dir, '../public/icon.svg'))

for (const size of [192, 512]) {
  await sharp(svg)
    .resize(size, size)
    .png()
    .toFile(join(__dir, `../public/icon-${size}.png`))
  console.log(`✓ icon-${size}.png`)
}
