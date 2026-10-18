import Markdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { guideUrl } from '../../app/use-view';
import type { Guide } from '../../lib/guides/guide-registry';
import { guideSections } from './guide-sections';

export function GuideContent({
  guide,
  markdown,
}: {
  guide: Guide;
  markdown: string;
}) {
  return (
    <Markdown
      skipHtml
      allowedElements={[
        'section',
        'h2',
        'h3',
        'h4',
        'p',
        'a',
        'strong',
        'em',
        'ul',
        'ol',
        'li',
        'blockquote',
        'table',
        'thead',
        'tbody',
        'tr',
        'th',
        'td',
        'hr',
        'code',
        'pre',
        'br',
      ]}
      remarkPlugins={[remarkGfm, [guideSections, guide]]}
      components={{
        table: ({ children, ...props }) => (
          <div className="guide-table-wrap">
            <table aria-labelledby={props['aria-labelledby']}>{children}</table>
          </div>
        ),
        a: ({ href, children }) => {
          const internal = href?.startsWith('#');
          return (
            <a
              href={internal ? guideUrl(guide.slug, href!.slice(1)) : href}
              target={internal ? undefined : '_blank'}
              rel={internal ? undefined : 'noreferrer'}
            >
              {children}
              {!internal && (
                <span className="sr-only"> (opens in a new tab)</span>
              )}
            </a>
          );
        },
      }}
    >
      {markdown}
    </Markdown>
  );
}
