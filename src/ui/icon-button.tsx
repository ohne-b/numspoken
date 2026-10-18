import { Icon } from '@mdi/react';
import type { ComponentProps } from 'react';

interface Props extends ComponentProps<'button'> {
  label: string;
  path: string;
}
export function IconButton({ label, path, className = '', ...props }: Props) {
  return (
    <button
      type="button"
      className={`icon-button ${className}`}
      aria-label={label}
      {...props}
    >
      <Icon path={path} size={0.9} aria-hidden="true" />
      <span className="icon-tooltip" aria-hidden="true">
        {label}
      </span>
    </button>
  );
}
