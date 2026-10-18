import { readFile, readdir } from 'node:fs/promises';
import { expect, it } from 'vitest';
import { unified } from 'unified';
import remarkParse from 'remark-parse';
import remarkGfm from 'remark-gfm';
import type { Nodes } from 'mdast';
import { guideForLanguage, guides } from './guide-registry';
import { languages, languageFor } from '../languages';
import { loadConverter } from '../number-words';
import { validateAnswer } from '../validate-answer';
import { headingId, nodeText } from '../../features/guides/guide-sections';

it('covers every language and variant with exactly one Markdown guide', async () => {
  expect(
    new Set(guides.map((guide) => languageFor(guide.locale).group)),
  ).toEqual(new Set(languages.map((language) => language.group)));
  expect(guides).toHaveLength(50);
  expect((await readdir('content/guides/en')).sort()).toEqual(
    guides.map(({ slug }) => `${slug}.md`).sort(),
  );
  for (const language of languages)
    expect(guideForLanguage(language)).toBeDefined();
});

it.each(guides)(
  '$slug has complete, navigable content and answers accepted by practice',
  async (guide) => {
    const markdown = await readFile(
      `content/guides/en/${guide.slug}.md`,
      'utf8',
    );
    const tree = unified().use(remarkParse).use(remarkGfm).parse(markdown);
    const headings = tree.children.filter((node) => node.type === 'heading');
    expect(headings.filter((node) => node.depth === 1).map(nodeText)).toEqual([
      `${languageFor(guide.locale).group} numbers`,
    ]);
    const ids = headings.map((node) => headingId(nodeText(node)));
    expect(new Set(ids).size, 'duplicate heading IDs break section links').toBe(
      ids.length,
    );
    expect(ids).toContain('quick-reference');
    expect(ids).toContain('larger-numbers');
    expect(ids.at(-1)).toBe('sources');
    for (const id of Object.keys(guide.sections ?? {}))
      expect(ids).toContain(id);
    const links: string[] = [];
    function inspect(node: Nodes) {
      expect(node.type, 'keep guides ordinary Markdown').not.toBe('html');
      if (node.type === 'link') {
        expect(node.url).toMatch(/^(https:\/\/|#)/);
        if (node.url.startsWith('#')) expect(ids).toContain(node.url.slice(1));
        links.push(node.url);
      }
      if ('children' in node) node.children.forEach(inspect);
    }
    inspect(tree);
    expect(
      links.filter((url) => url.startsWith('https://')).length,
    ).toBeGreaterThan(0);
    let section = '';
    let locales = [guide.locale];
    let rows = 0;
    for (const node of tree.children) {
      if (node.type === 'heading') {
        const id = headingId(nodeText(node));
        if (node.depth === 2) section = id;
        locales = guide.sections?.[id] ??
          guide.sections?.[section] ?? [guide.locale];
      }
      if (node.type !== 'table') continue;
      for (const row of node.children.slice(1)) {
        const digits = nodeText(row.children[0]).replace(/[\s,.]/g, '');
        expect(digits).toMatch(/^\d+$/);
        const value = Number(digits);
        rows++;
        for (const [index, cell] of row.children.slice(1).entries()) {
          const locale = locales[index] ?? locales[0];
          const words = nodeText(cell);
          const boundaries = new Set(
            [
              ...new Intl.Segmenter(locale, {
                granularity: 'grapheme',
              }).segment(words),
            ].map(({ index }) => index),
          );
          boundaries.add(words.length);
          let offset = 0;
          for (const inline of cell.children) {
            const end = offset + nodeText(inline).length;
            if (inline.type === 'strong' || inline.type === 'emphasis') {
              expect(
                boundaries.has(offset),
                `${locale}: emphasis splits ${words}`,
              ).toBe(true);
              expect(
                boundaries.has(end),
                `${locale}: emphasis splits ${words}`,
              ).toBe(true);
            }
            offset = end;
          }
          expect(words).not.toMatch(/undefined|NaN|�|\{\{/);
          if (value > 999999) continue; // Larger reference values are outside practice.
          const answer = (await loadConverter(locale))(value);
          expect(
            validateAnswer(words, answer.candidates, languageFor(locale), false)
              .complete,
            `${locale} ${value}: guide “${words}”, practice “${answer.canonical}”`,
          ).toBe(true);
        }
      }
    }
    expect(rows).toBeGreaterThanOrEqual(50);
  },
);
