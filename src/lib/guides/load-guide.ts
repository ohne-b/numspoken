import { loadFont } from '../fonts';
import { languageFor } from '../languages';
import type { Guide } from './guide-registry';

const loaders = import.meta.glob<string>('/content/guides/en/*.md', {
  query: '?raw',
  import: 'default',
});
const cache = new Map<string, Promise<string>>();

export function loadGuide(guide: Guide): Promise<string> {
  const cached = cache.get(guide.slug);
  if (cached) return cached;
  const promise = (async () => {
    const loader = loaders[`/content/guides/en/${guide.slug}.md`];
    if (!loader) throw new Error('Unknown guide');
    const markdown = await loader();
    const fonts = new Set(
      [guide.locale, ...Object.values(guide.sections ?? {}).flat()].map(
        (locale) => languageFor(locale).font,
      ),
    );
    await Promise.all([...fonts].map((font) => loadFont(font, markdown)));
    return markdown;
  })().catch((error: unknown) => {
    cache.delete(guide.slug);
    throw error;
  });
  cache.set(guide.slug, promise);
  return promise;
}
