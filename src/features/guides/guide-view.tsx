import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { mdiArrowLeft, mdiRefresh } from '@mdi/js';
import { navigate } from '../../app/use-view';
import { guideForSlug } from '../../lib/guides/guide-registry';
import { loadGuide } from '../../lib/guides/load-guide';
import { languageFor } from '../../lib/languages';
import { IconButton } from '../../ui/icon-button';
import { GuideContent } from './guide-content';
import './guide-styles.css';

const scrollPositions = new Map<string, number>();

export default function GuideView({
  slug,
  section,
}: {
  slug: string;
  section: string | null;
}) {
  const guide = guideForSlug(slug);
  const title = guide
    ? `${languageFor(guide.locale).group} numbers`
    : 'Guide not found';
  const titleRef = useRef<HTMLHeadingElement>(null);
  const savedScroll = useRef(scrollPositions.get(slug) ?? 0);
  const [retry, setRetry] = useState(0);
  const [resource, setResource] = useState<{
    key: string;
    markdown?: string;
    error?: boolean;
  }>();
  const key = `${slug}:${retry}`;
  const markdown = resource?.key === key ? resource.markdown : undefined;
  const failed = resource?.key === key && resource.error;

  useEffect(() => {
    if (!guide) return;
    let current = true;
    void loadGuide(guide)
      .then((markdown) => {
        if (current) setResource({ key, markdown });
      })
      .catch(() => {
        if (current) setResource({ key, error: true });
      });
    return () => {
      current = false;
    };
  }, [guide, key]);

  useLayoutEffect(() => {
    document.title = `${title} — numspoken`;
    titleRef.current?.focus({ preventScroll: true });
    window.scrollTo(0, 0);
  }, [title]);

  useLayoutEffect(() => {
    const save = () => {
      scrollPositions.set(slug, window.scrollY);
    };
    const close = (event: KeyboardEvent) => {
      if (
        event.key === 'Escape' &&
        !event.defaultPrevented &&
        !event.isComposing
      ) {
        event.preventDefault();
        navigate('practice');
      }
    };
    window.addEventListener('scroll', save, { passive: true });
    window.addEventListener('keydown', close);
    return () => {
      window.removeEventListener('scroll', save);
      window.removeEventListener('keydown', close);
    };
  }, [slug]);

  useLayoutEffect(() => {
    if (!markdown) return;
    const target = section ? document.getElementById(`guide-${section}`) : null;
    if (target) {
      target.focus({ preventScroll: true });
      target.scrollIntoView({ block: 'start' });
    } else window.scrollTo(0, savedScroll.current);
    scrollPositions.set(slug, window.scrollY);
  }, [markdown, section, slug]);

  return (
    <article className="guide-view" lang="en" aria-labelledby="guide-title">
      <div className="guide-heading">
        <IconButton
          label="Back to practice"
          tooltip={false}
          path={mdiArrowLeft}
          onClick={() => navigate('practice')}
        />
        <h1 id="guide-title" tabIndex={-1} ref={titleRef}>
          {title}
        </h1>
      </div>
      {!guide ? (
        <p className="load-state">There isn’t a guide at this address.</p>
      ) : markdown ? (
        <GuideContent guide={guide} markdown={markdown} />
      ) : (
        <div className="load-state" role="status">
          {failed ? (
            <>
              <p>Couldn’t load this guide.</p>
              <IconButton
                label={retry > 0 ? 'Reload guide' : 'Retry loading guide'}
                path={mdiRefresh}
                onClick={() =>
                  retry > 0 ? location.reload() : setRetry((value) => value + 1)
                }
              />
            </>
          ) : (
            'Loading guide…'
          )}
        </div>
      )}
    </article>
  );
}
