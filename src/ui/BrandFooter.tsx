import { Icon } from '@mdi/react';
import { mdiGithub } from '@mdi/js';

export function BrandFooter() {
  return (
    <footer className="brand-footer">
      <span className="brand">
        <img
          src={`${import.meta.env.BASE_URL}brand/numspoken.svg`}
          alt=""
          width="21"
          height="23"
        />
        <span>numspoken</span>
      </span>
      <span className="footer-divider" aria-hidden="true" />
      <a
        className="icon-button"
        href="https://github.com/ohne-b/numspoken"
        aria-label="Source on GitHub"
        target="_blank"
        rel="noreferrer"
      >
        <Icon path={mdiGithub} size={0.9} aria-hidden="true" />
        <span className="icon-tooltip" aria-hidden="true">
          Source on GitHub
        </span>
      </a>
    </footer>
  );
}
