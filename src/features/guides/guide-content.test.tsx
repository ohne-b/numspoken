import { cleanup, render, screen, within } from '@testing-library/react';
import { afterEach, expect, it } from 'vitest';
import { GuideContent } from './guide-content';

afterEach(cleanup);

it('renders ordinary Markdown as labelled reference groups with native-language cells', () => {
  const { container } = render(
    <GuideContent
      guide={{ slug: 'arabic', locale: 'ar-SA' }}
      markdown={`# Arabic numbers
## Quick reference
### 0–9
| Number | Arabic |
| -----: | ------ |
| 1 | **واحد** |
## Larger numbers
### Hundreds
| Number | Arabic |
| -----: | ------ |
| 100 | مئة |
## Joining parts
Use *و* between parts.
`}
    />,
  );
  const reference = screen.getByRole('region', { name: 'Quick reference' });
  expect(
    within(reference).getByRole('table', { name: '0–9' }),
  ).toBeInTheDocument();
  const word = screen.getByRole('cell', { name: 'واحد' });
  expect(word).toHaveAttribute('lang', 'ar-SA');
  expect(word).toHaveAttribute('dir', 'rtl');
  expect(screen.getByRole('cell', { name: '1' })).toHaveAttribute('dir', 'ltr');
  expect(container.querySelector('em')).toHaveAttribute('lang', 'ar-SA');
  expect(container.querySelector('h1')).toBeNull();
  expect(screen.getByRole('region', { name: 'Larger numbers' })).toHaveClass(
    'guide-large-numbers',
  );
});

it('assigns different scripts to variant columns and keeps section links in the guide', () => {
  render(
    <GuideContent
      guide={{
        slug: 'serbian',
        locale: 'sr-Cyrl-RS',
        sections: { scripts: ['sr-Cyrl-RS', 'sr-Latn-RS'] },
      }}
      markdown={`## Scripts
| Number | Cyrillic | Latin |
| -----: | -------- | ----- |
| 1 | један | jedan |

[Scripts](#scripts)
`}
    />,
  );
  expect(screen.getByRole('cell', { name: 'један' })).toHaveAttribute(
    'lang',
    'sr-Cyrl-RS',
  );
  expect(screen.getByRole('cell', { name: 'jedan' })).toHaveAttribute(
    'lang',
    'sr-Latn-RS',
  );
  expect(screen.getByRole('link', { name: 'Scripts' })).toHaveAttribute(
    'href',
    '#/guides/serbian?section=scripts',
  );
});

it('discards raw HTML and unsafe URLs while retaining source links', () => {
  const { container } = render(
    <GuideContent
      guide={{ slug: 'spanish', locale: 'es-ES' }}
      markdown={`## Sources
<script>alert(1)</script>
<img src="https://tracker.invalid/pixel">

[Unsafe](javascript:alert%281%29)
[RAE](https://www.rae.es/dpd/cardinales)
`}
    />,
  );
  expect(container.querySelector('script, img')).toBeNull();
  expect(container.querySelector('a[href^="javascript:"]')).toBeNull();
  expect(screen.getByRole('link', { name: /RAE/ })).toHaveAttribute(
    'rel',
    'noreferrer',
  );
});
