import { Icon } from '@mdi/react';
import type { ComponentProps } from 'react';
import { IconButton as MaterialIconButton } from 'material/react';

interface Props extends ComponentProps<typeof MaterialIconButton> {
  label: string;
  path: string;
  tooltip?: boolean;
}
export function IconButton({
  label,
  path,
  tooltip = true,
  className = '',
  ...props
}: Props) {
  return (
    <span className={`icon-action ${className}`}>
      <MaterialIconButton
        type="button"
        className="icon-button"
        aria-label={label}
        {...props}
      />
      <Icon path={path} size={0.9} aria-hidden="true" />
      {tooltip && (
        <span className="icon-tooltip" aria-hidden="true">
          {label}
        </span>
      )}
    </span>
  );
}
