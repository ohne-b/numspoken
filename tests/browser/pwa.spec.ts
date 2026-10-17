import { expect, test } from '@playwright/test';
import { answerField, openPractice } from './helpers';

test('serves installable app metadata and decodable icons under the Pages base path', async ({
  page,
  request,
}) => {
  await page.goto('./#/settings');
  const manifestUrl = await page
    .locator('link[rel="manifest"]')
    .getAttribute('href');
  expect(manifestUrl).toBe('/numspoken/manifest.webmanifest');
  const response = await request.get(manifestUrl!);
  expect(response.ok()).toBe(true);
  const manifest = await response.json();
  expect(manifest).toMatchObject({
    id: '/numspoken/',
    name: 'numspoken',
    short_name: 'numspoken',
    start_url: '/numspoken/',
    scope: '/numspoken/',
    display: 'standalone',
  });
  expect(manifest.prefer_related_applications).not.toBe(true);
  expect(manifest.icons).toEqual(
    expect.arrayContaining([
      expect.objectContaining({ sizes: '192x192', purpose: 'any' }),
      expect.objectContaining({ sizes: '512x512', purpose: 'any' }),
      expect.objectContaining({ sizes: '512x512', purpose: 'maskable' }),
    ]),
  );
  const appleIcon = await page
    .locator('link[rel="apple-touch-icon"]')
    .getAttribute('href');
  for (const icon of [
    ...manifest.icons,
    { src: appleIcon, sizes: '180x180' },
  ]) {
    const url = new URL(icon.src, response.url());
    expect(url.pathname).toMatch(/^\/numspoken\/brand\//);
    const pixels = await page.evaluate(async (url) => {
      const image = new Image();
      image.src = url;
      await image.decode();
      const canvas = document.createElement('canvas');
      const size = image.naturalWidth;
      canvas.width = canvas.height = size;
      const context = canvas.getContext('2d')!;
      context.drawImage(image, 0, 0);
      const { data } = context.getImageData(0, 0, size, size);
      let opaque = true;
      let outsideSafeCircle = 0;
      let logoPixels = 0;
      for (let y = 0; y < size; y++) {
        for (let x = 0; x < size; x++) {
          const offset = (y * size + x) * 4;
          opaque &&= data[offset + 3] === 255;
          if (
            data[offset] === 23 &&
            data[offset + 1] === 25 &&
            data[offset + 2] === 29
          )
            continue;
          logoPixels++;
          if (Math.hypot(x + 0.5 - size / 2, y + 0.5 - size / 2) > size * 0.4)
            outsideSafeCircle++;
        }
      }
      return {
        width: size,
        height: image.naturalHeight,
        opaque,
        outsideSafeCircle,
        logoPixels,
      };
    }, url.href);
    expect(`${pixels.width}x${pixels.height}`).toBe(icon.sizes);
    expect(pixels.opaque).toBe(true);
    expect(pixels.logoPixels).toBeGreaterThan(0);
    if (icon.purpose === 'maskable') expect(pixels.outsideSafeCircle).toBe(0);
  }
  await page.goto(manifest.start_url);
  await expect(answerField(page)).toBeEditable();
});
