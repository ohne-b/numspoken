import { readFile, writeFile } from 'node:fs/promises';
import { chromium } from '@playwright/test';

// Regenerate from the supplied logo with `node scripts/generate-icons.mjs`.
const brand = new URL('../public/brand/', import.meta.url);
const svg = await readFile(new URL('numspoken.svg', brand), 'utf8');
const browser = await chromium.launch();
try {
  const page = await browser.newPage();
  for (const [name, size, scale] of [
    ['icon-192.png', 192, 0.72],
    ['icon-512.png', 512, 0.72],
    ['icon-maskable-512.png', 512, 0.56],
    ['apple-touch-icon.png', 180, 0.72],
  ]) {
    const png = await page.evaluate(
      async ({ svg, size, scale }) => {
        const image = new Image();
        image.src = `data:image/svg+xml,${encodeURIComponent(svg)}`;
        await image.decode();
        const canvas = document.createElement('canvas');
        canvas.width = canvas.height = size;
        const context = canvas.getContext('2d');
        context.fillStyle = '#17191d';
        context.fillRect(0, 0, size, size);
        const height = size * scale;
        const width = (height * image.naturalWidth) / image.naturalHeight;
        context.drawImage(
          image,
          (size - width) / 2,
          (size - height) / 2,
          width,
          height,
        );
        return canvas.toDataURL('image/png').split(',')[1];
      },
      { svg, size, scale },
    );
    await writeFile(new URL(name, brand), Buffer.from(png, 'base64'));
  }
} finally {
  await browser.close();
}
