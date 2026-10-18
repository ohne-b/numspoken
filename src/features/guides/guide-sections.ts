import type { Root, RootContent, Blockquote, Nodes } from 'mdast';
import { fontFamilies } from '../../lib/fonts';
import { languageFor, type LocaleCode } from '../../lib/languages';
import type { Guide } from '../../lib/guides/guide-registry';

export function nodeText(node: Nodes): string {
  if ('value' in node) return node.value;
  return 'children' in node
    ? node.children.map((child) => nodeText(child)).join('')
    : '';
}

export function headingId(text: string): string {
  return text
    .toLowerCase()
    .replace(/[–—]/g, '-')
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/[\s-]+/g, '-');
}

function languageProperties(locale: LocaleCode) {
  const language = languageFor(locale);
  return {
    lang: locale,
    dir: language.direction,
    style: `font-family: "${fontFamilies[language.font]}", sans-serif`,
  };
}

function annotate(
  node: RootContent,
  locales: LocaleCode[],
  tableLabel: string,
) {
  if (node.type === 'table') {
    node.data = { hProperties: { 'aria-labelledby': tableLabel } };
    node.children.forEach((row, index) => {
      row.children.forEach((cell, column) => {
        cell.data = {
          hProperties:
            index === 0
              ? { scope: 'col' }
              : column === 0
                ? { dir: 'ltr', className: ['guide-number'] }
                : languageProperties(locales[column - 1] ?? locales[0]),
        };
      });
    });
  }
  if (node.type === 'emphasis')
    node.data = { hProperties: languageProperties(locales[0]) };
  if ('children' in node && node.type !== 'table')
    node.children.forEach((child) =>
      annotate(child as RootContent, locales, tableLabel),
    );
}

function section(id: string, className: string): Blockquote {
  return {
    type: 'blockquote',
    children: [],
    data: {
      hName: 'section',
      hProperties: { className: [className], 'aria-labelledby': `guide-${id}` },
    },
  };
}

export function guideSections(guide: Guide) {
  return (tree: Root) => {
    const result: RootContent[] = [];
    let current: Blockquote | undefined;
    let group: Blockquote | undefined;
    let sectionId = '';
    let label = 'guide-title';
    let locales = [guide.locale];
    for (const node of tree.children) {
      if (node.type === 'heading') {
        const id = headingId(nodeText(node));
        if (node.depth === 1) continue;
        label = `guide-${id}`;
        node.data = { hProperties: { id: label, tabIndex: -1 } };
        if (node.depth === 2) {
          sectionId = id;
          locales = guide.sections?.[id] ?? [guide.locale];
          current = section(
            id,
            id === 'quick-reference'
              ? 'guide-reference'
              : id === 'larger-numbers'
                ? 'guide-large-numbers'
                : 'guide-prose',
          );
          group = undefined;
          result.push(current);
        } else if (node.depth === 3) {
          locales = guide.sections?.[id] ??
            guide.sections?.[sectionId] ?? [guide.locale];
          if (
            sectionId === 'quick-reference' ||
            sectionId === 'larger-numbers'
          ) {
            group = section(id, 'guide-reference-group');
            current?.children.push(group);
          }
        }
      }
      annotate(node, locales, label);
      (group?.children ?? current?.children ?? result).push(
        node as Blockquote['children'][number],
      );
    }
    tree.children = result;
  };
}
